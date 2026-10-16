<?php
declare(strict_types=1);

// Run with: php tests/leadership-interest.test.php
// Every endpoint invocation uses a fake mail transport. No real emails are sent.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
define('MULEMBE_EOI_LIBRARY_ONLY', true);
require __DIR__ . '/../public/leadership-interest.php';

use function Mulembe\LeadershipInterest\process_request;

function fixture(array $overrides = []): array
{
    return array_replace([
        'fullName' => 'Test Community Member',
        'dateOfBirth' => '1992-02-29',
        'address' => "10 Example Street\nSydney NSW 2000",
        'motivation' => "I would like to support the community.\nI bring experience organising events.",
        'email' => 'applicant@example.com',
        'phone' => '+61 (400) 123-456',
        'positions' => ['chairperson', 'welfare-coordinator'],
        'constitutionConsent' => true,
        'constitutionVersion' => '2026',
    ], $overrides);
}

function expect(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function request_with_mock($data, array $serverOverrides = [], $transportResult = true): array
{
    $calls = [];
    $server = array_replace(['REQUEST_METHOD' => 'POST', 'CONTENT_TYPE' => 'application/json; charset=UTF-8'], $serverOverrides);
    $raw = is_string($data) ? $data : json_encode($data, JSON_THROW_ON_ERROR);
    $result = process_request($server, $raw, static function (...$args) use (&$calls, $transportResult): bool {
        $calls[] = $args;
        if ($transportResult instanceof Throwable) {
            throw $transportResult;
        }
        return $transportResult;
    });
    $result['mailCalls'] = $calls;
    return $result;
}

function decode_email_parts(array $call): array
{
    expect((bool) preg_match('/boundary="([^"]+)"/', $call[3], $match), 'MIME boundary must be declared.');
    $parts = [];
    foreach (explode('--' . $match[1], $call[2]) as $part) {
        if (strpos($part, 'Content-Type:') === false) {
            continue;
        }
        $segments = explode("\r\n\r\n", trim($part), 2);
        expect(count($segments) === 2, 'Each MIME part must have headers and content.');
        $decoded = base64_decode($segments[1], true);
        expect($decoded !== false, 'MIME content must be valid base64.');
        $parts[] = ['headers' => $segments[0], 'content' => $decoded];
    }
    return $parts;
}

$tests = [];
$tests['valid application sends all requested fields to the fixed reviewer'] = static function (): void {
    $result = request_with_mock(fixture());
    expect($result['status'] === 200 && $result['body']['ok'] === true, 'Valid submission must succeed.');
    expect(count($result['mailCalls']) === 1, 'Exactly one email must be attempted.');
    $mail = $result['mailCalls'][0];
    expect($mail[0] === 'mulembecommunitysydneyau@gmail.com', 'Recipient must match the requested inbox.');
    expect(strpos($mail[3], 'From: Mulembe Community NSW <no-reply@mulembecommunitynswinc.org.au>') !== false, 'Sender must be the fixed site address.');
    expect(strpos($mail[3], 'Reply-To: applicant@example.com') !== false, 'Reply-To must be the validated applicant email.');
    $parts = decode_email_parts($mail);
    expect(count($parts) === 3, 'Email needs HTML, JSON and CSV parts.');
    expect(strpos($parts[0]['content'], 'President; Welfare Coordinator') !== false, 'Reviewer needs human-readable role names.');
    expect(strpos($parts[0]['content'], 'I would like to support the community.<br />') !== false, 'Email must include the statement with readable paragraphs.');
    expect(strpos($parts[2]['content'], 'I bring experience organising events.') !== false, 'CSV must include the applicant statement.');
    $json = json_decode($parts[1]['content'], true, 16, JSON_THROW_ON_ERROR);
    foreach (fixture() as $key => $value) {
        expect($json[$key] === $value, 'JSON attachment must preserve field: ' . $key);
    }
    expect(isset($json['submittedAt']) && strpos($json['submittedAt'], 'T') !== false, 'Submission timestamp must be server-generated.');
    expect($json['positionNames'] === ['President', 'Welfare Coordinator'], 'JSON attachment must explain the role IDs.');
    expect(strpos($parts[2]['headers'], 'leadership-expression-of-interest.csv') !== false, 'CSV attachment must have a readable filename.');
};

$tests['Unicode and multiline addresses survive with safe HTML'] = static function (): void {
    $result = request_with_mock(fixture(['fullName' => 'Renée <Committee> & Mwangi']));
    expect($result['status'] === 200, 'Unicode names must be accepted.');
    $parts = decode_email_parts($result['mailCalls'][0]);
    expect(strpos($parts[0]['content'], 'Renée &lt;Committee&gt; &amp; Mwangi') !== false, 'HTML must escape applicant text.');
    expect(strpos($parts[0]['content'], '<Committee>') === false, 'Applicant markup must not become HTML.');
    expect(strpos($parts[0]['content'], '10 Example Street<br />') !== false, 'Address line breaks should remain legible.');
};

$tests['spreadsheet formulas are escaped without modifying JSON data'] = static function (): void {
    $result = request_with_mock(fixture(['fullName' => '=1+1', 'address' => '@SUM(1+1)']));
    expect($result['status'] === 200, 'Ordinary text should not be rejected simply for formula-like prefixes.');
    $parts = decode_email_parts($result['mailCalls'][0]);
    $csv = fopen('php://memory', 'r+');
    fwrite($csv, $parts[2]['content']);
    rewind($csv);
    $fields = [];
    while (($row = fgetcsv($csv, 0, ',', '"', '')) !== false) {
        $fields[$row[0]] = $row[1];
    }
    fclose($csv);
    expect($fields['Full name'] === "'=1+1", 'CSV name must not execute as a formula.');
    expect($fields['Address'] === "'@SUM(1+1)", 'CSV address must not execute as a formula.');
    expect($fields['Phone number'] === "'+61 (400) 123-456", 'International phone must be treated as text.');
    $json = json_decode($parts[1]['content'], true);
    expect($json['fullName'] === '=1+1', 'JSON should preserve the entered name.');
};

$tests['all nine roles and field length boundaries are accepted'] = static function (): void {
    $result = request_with_mock(fixture([
        'fullName' => str_repeat('é', 160),
        'address' => str_repeat('x', 1000),
        'motivation' => str_repeat('x', 2000),
        'positions' => array_keys(Mulembe\LeadershipInterest\positions()),
    ]));
    expect($result['status'] === 200, 'Character limits must count Unicode characters rather than bytes.');
};

$tests['unknown fields and host header cannot alter recipient or sender'] = static function (): void {
    $result = request_with_mock(fixture(['to' => 'attacker@example.com', 'submittedAt' => 'fake timestamp']), ['HTTP_HOST' => "attacker.example\r\nBcc: attacker@example.com"]);
    expect($result['status'] === 200, 'Host header is not used to construct email headers.');
    $mail = $result['mailCalls'][0];
    expect(strpos($mail[3], 'attacker') === false && strpos($mail[3], 'Bcc:') === false, 'Untrusted server host must not enter headers.');
    $parts = decode_email_parts($mail);
    $json = json_decode($parts[1]['content'], true);
    expect(!isset($json['to']) && $json['submittedAt'] !== 'fake timestamp', 'Only validated form fields may enter the attachment.');
};

$tomorrow = (new DateTimeImmutable('tomorrow', new DateTimeZone('Australia/Sydney')))->format('Y-m-d');
$invalidCases = [
    'missing name' => [['fullName' => null], 'fullName'],
    'non-string name' => [['fullName' => ['name']], 'fullName'],
    'blank name' => [['fullName' => '   '], 'fullName'],
    'long Unicode name' => [['fullName' => str_repeat('é', 161)], 'fullName'],
    'name control character' => [['fullName' => "Test\x00Name"], 'fullName'],
    'invalid leap day' => [['dateOfBirth' => '2023-02-29'], 'dateOfBirth'],
    'impossible date' => [['dateOfBirth' => '1990-04-31'], 'dateOfBirth'],
    'date with year zero' => [['dateOfBirth' => '0000-01-01'], 'dateOfBirth'],
    'wrong date format' => [['dateOfBirth' => '02/10/1990'], 'dateOfBirth'],
    'future birth date' => [['dateOfBirth' => $tomorrow], 'dateOfBirth'],
    'missing address' => [['address' => ''], 'address'],
    'oversized address' => [['address' => str_repeat('a', 1001)], 'address'],
    'missing statement' => [['motivation' => null], 'motivation'],
    'blank statement' => [['motivation' => " \n\t "], 'motivation'],
    'non-string statement' => [['motivation' => ['text']], 'motivation'],
    'oversized statement' => [['motivation' => str_repeat('a', 2001)], 'motivation'],
    'invalid email' => [['email' => 'not-an-email'], 'email'],
    'email header injection' => [['email' => "applicant@example.com\r\nBcc: attacker@example.com"], 'email'],
    'email with trailing line break' => [['email' => "applicant@example.com\n"], 'email'],
    'invalid phone text' => [['phone' => 'call me tomorrow'], 'phone'],
    'too few phone digits' => [['phone' => '+12345'], 'phone'],
    'too many phone digits' => [['phone' => '+1234567890123456'], 'phone'],
    'misplaced phone plus' => [['phone' => '0400+123456'], 'phone'],
    'missing positions' => [['positions' => null], 'positions'],
    'empty positions' => [['positions' => []], 'positions'],
    'unknown role' => [['positions' => ['president']], 'positions'],
    'duplicate role' => [['positions' => ['secretary', 'secretary']], 'positions'],
    'non-string role' => [['positions' => [['secretary']]], 'positions'],
    'role map instead of array' => [['positions' => (object) ['first' => 'secretary']], 'positions'],
    'false constitution consent' => [['constitutionConsent' => false], 'constitutionConsent'],
    'text constitution consent' => [['constitutionConsent' => 'true'], 'constitutionConsent'],
    'numeric constitution consent' => [['constitutionConsent' => 1], 'constitutionConsent'],
    'missing constitution consent' => [['constitutionConsent' => null], 'constitutionConsent'],
    'outdated constitution' => [['constitutionVersion' => '2025'], 'constitutionVersion'],
    'numeric constitution version' => [['constitutionVersion' => 2026], 'constitutionVersion'],
];
foreach ($invalidCases as $name => [$overrides, $field]) {
    $tests[$name . ' is rejected before email'] = static function () use ($overrides, $field): void {
        $result = request_with_mock(fixture($overrides));
        expect($result['status'] === 422 && $result['body']['ok'] === false, 'Invalid field must return 422.');
        expect(isset($result['body']['errors'][$field]), 'Response must identify the field: ' . $field);
        expect(count($result['mailCalls']) === 0, 'Invalid submission must not attempt email.');
    };
}

$requestCases = [
    'wrong HTTP method' => [fixture(), ['REQUEST_METHOD' => 'GET'], 405],
    'unsupported content type' => [fixture(), ['CONTENT_TYPE' => 'text/plain'], 415],
    'missing content type' => [fixture(), ['CONTENT_TYPE' => ''], 415],
    'malformed JSON' => ['{broken', [], 400],
    'empty JSON' => ['', [], 400],
    'JSON null' => ['null', [], 400],
    'JSON array' => ['[]', [], 400],
    'JSON scalar' => ['true', [], 400],
    'oversized body' => [str_repeat('x', Mulembe\LeadershipInterest\MAX_BODY_BYTES + 1), [], 413],
    'oversized content length' => [fixture(), ['CONTENT_LENGTH' => '999999999'], 413],
];
foreach ($requestCases as $name => [$data, $server, $status]) {
    $tests[$name . ' is rejected before email'] = static function () use ($data, $server, $status): void {
        $result = request_with_mock($data, $server);
        expect($result['status'] === $status && $result['body']['ok'] === false, 'Expected HTTP status ' . $status . '.');
        expect(count($result['mailCalls']) === 0, 'Rejected request must not attempt email.');
    };
}

$tests['mail service failure is never reported as success'] = static function (): void {
    $result = request_with_mock(fixture(), [], false);
    expect($result['status'] === 503 && $result['body']['ok'] === false, 'Mail rejection must be retryable failure.');
    expect(count($result['mailCalls']) === 1, 'Valid submission must attempt mail once.');
};
$tests['mail exception does not disclose server details'] = static function (): void {
    $result = request_with_mock(fixture(), [], new RuntimeException('private configuration detail'));
    expect($result['status'] === 503 && $result['body']['ok'] === false, 'Transport exceptions must fail cleanly.');
    expect(strpos($result['body']['message'], 'private configuration detail') === false, 'Private transport details must not enter the response.');
};
$tests['today is accepted without imposing an unspecified minimum age'] = static function (): void {
    $today = (new DateTimeImmutable('today', new DateTimeZone('Australia/Sydney')))->format('Y-m-d');
    expect(request_with_mock(fixture(['dateOfBirth' => $today]))['status'] === 200, 'The endpoint must not invent eligibility rules.');
};

$failed = 0;
foreach ($tests as $name => $test) {
    try {
        $test();
        fwrite(STDOUT, 'PASS ' . $name . PHP_EOL);
    } catch (Throwable $exception) {
        $failed++;
        fwrite(STDERR, 'FAIL ' . $name . ': ' . $exception->getMessage() . PHP_EOL);
    }
}
fwrite(STDOUT, (count($tests) - $failed) . '/' . count($tests) . ' tests passed. No real emails sent.' . PHP_EOL);
exit($failed === 0 ? 0 : 1);
