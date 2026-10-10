<?php
declare(strict_types=1);

namespace Mulembe\LeadershipInterest;

// PHP 7.4+ endpoint for shared PHP hosting. Submissions are emailed, never saved
// to disk. The hosting mail service must authorize this fixed site-domain sender.
const RECIPIENT = 'mulembecommunitysydneyau@gmail.com';
const SENDER = 'no-reply@mulembecommunitynswinc.org.au';
const MAX_BODY_BYTES = 65536;
const CONSTITUTION_VERSION = '2026';

function positions(): array
{
    return [
        'chairperson' => 'Chairperson',
        'vice-chairperson' => 'Vice-Chairperson',
        'secretary' => 'Secretary',
        'treasurer' => 'Treasurer',
        'public-officer' => 'Public Officer',
        'events-coordinator' => 'Events Coordinator',
        'welfare-coordinator' => 'Welfare Coordinator',
        'social-media-coordinator' => 'Social Media Coordinator',
        'advisory-representative' => 'Advisory Representative',
    ];
}

function response(int $status, string $message, array $errors = []): array
{
    $body = ['ok' => $status >= 200 && $status < 300, 'message' => $message];
    if ($errors !== []) {
        $body['errors'] = $errors;
    }
    return ['status' => $status, 'body' => $body];
}

function string_field(array $data, string $key, string $label, int $maxLength, array &$errors, bool $multiline = false): string
{
    if (!isset($data[$key]) || !is_string($data[$key])) {
        $errors[$key] = 'Please enter your ' . $label . '.';
        return '';
    }
    $value = trim($data[$key]);
    // Permit line breaks in postal addresses, but never in header-bound fields.
    $controls = $multiline ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u' : '/[\x00-\x1F\x7F]/u';
    if ($value === '') {
        $errors[$key] = 'Please enter your ' . $label . '.';
    } elseif (preg_match($controls, $data[$key])) {
        $errors[$key] = 'Please remove unsupported characters from your ' . $label . '.';
    } elseif (preg_match_all('/./us', $value) > $maxLength) {
        $errors[$key] = 'Your ' . $label . ' must be ' . $maxLength . ' characters or fewer.';
    }
    return $value;
}

function validate(array $data): array
{
    $errors = [];
    $submission = [
        'fullName' => string_field($data, 'fullName', 'full name', 160, $errors),
        'dateOfBirth' => string_field($data, 'dateOfBirth', 'date of birth', 10, $errors),
        'address' => string_field($data, 'address', 'address', 1000, $errors, true),
        'motivation' => string_field($data, 'motivation', 'statement explaining why you would like to serve', 2000, $errors, true),
        'email' => string_field($data, 'email', 'email address', 254, $errors),
        'phone' => string_field($data, 'phone', 'phone number', 40, $errors),
    ];

    $dob = $submission['dateOfBirth'];
    if (!isset($errors['dateOfBirth'])) {
        $validDate = preg_match('/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/D', $dob, $parts)
            && checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1]);
        $today = (new \DateTimeImmutable('today', new \DateTimeZone('Australia/Sydney')))->format('Y-m-d');
        if (!$validDate || $dob > $today) {
            $errors['dateOfBirth'] = 'Please enter a valid date of birth that is not in the future.';
        }
    }
    if (!isset($errors['email']) && !filter_var($submission['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Please enter a valid email address.';
    }
    if (!isset($errors['phone'])) {
        $digits = preg_replace('/[^0-9]/', '', $submission['phone']);
        if (!preg_match('/^\+?[0-9 ().\-]+$/D', $submission['phone']) || strlen($digits) < 7 || strlen($digits) > 15) {
            $errors['phone'] = 'Please enter a valid phone number with 7 to 15 digits.';
        }
    }

    $selected = $data['positions'] ?? null;
    $allowed = positions();
    if (!is_array($selected) || count($selected) < 1 || count($selected) > count($allowed)) {
        $errors['positions'] = 'Please select at least one of the available leadership positions.';
    } else {
        $seen = [];
        foreach ($selected as $position) {
            if (!is_string($position) || !isset($allowed[$position]) || isset($seen[$position])) {
                $errors['positions'] = 'Please select each available leadership position only once.';
                break;
            }
            $seen[$position] = true;
        }
    }
    $submission['positions'] = $selected;

    if (($data['constitutionConsent'] ?? null) !== true) {
        $errors['constitutionConsent'] = 'Please read the constitution and confirm that you have read it before submitting.';
    }
    if (($data['constitutionVersion'] ?? null) !== CONSTITUTION_VERSION) {
        $errors['constitutionVersion'] = 'Please review the Mulembe Community NSW Inc Constitution (2026) before submitting.';
    }
    $submission['constitutionConsent'] = true;
    $submission['constitutionVersion'] = CONSTITUTION_VERSION;

    return ['submission' => $submission, 'errors' => $errors];
}

function escape_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function csv_value(string $value): string
{
    // Keep applicant-controlled values from becoming spreadsheet formulas.
    if (preg_match('/^(?:\s*[=+\-@]|[\t\r\n])/u', $value)) {
        return "'" . $value;
    }
    return $value;
}

function email(array $submission): array
{
    $roleNames = array_map(static function (string $position): string {
        return positions()[$position];
    }, $submission['positions']);
    $submittedAt = new \DateTimeImmutable('now', new \DateTimeZone('Australia/Sydney'));
    $submission['positionNames'] = $roleNames;
    $submission['submittedAt'] = $submittedAt->format(\DateTimeInterface::ATOM);

    $fields = [
        'Full name' => $submission['fullName'],
        'Date of birth (YYYY-MM-DD)' => $submission['dateOfBirth'],
        'Address' => $submission['address'],
        'Email' => $submission['email'],
        'Phone number' => $submission['phone'],
        'Positions of interest' => implode('; ', $roleNames),
        'Why I would like to serve' => $submission['motivation'],
        'Constitution reviewed' => 'Yes - applicant confirmed reading the Mulembe Community NSW Inc Constitution (2026).',
        'Constitution version' => CONSTITUTION_VERSION,
        'Submitted at (Australia/Sydney)' => $submittedAt->format('Y-m-d H:i:s T'),
    ];

    $html = '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Leadership expression of interest</title></head><body>';
    $html .= '<h1>Mulembe leadership expression of interest</h1>';
    $html .= '<p>A community member has expressed interest in the following leadership positions. Please review their details below.</p>';
    $html .= '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">';
    foreach ($fields as $label => $value) {
        $html .= '<tr><th align="left" scope="row">' . escape_html($label) . '</th><td>' . nl2br(escape_html($value)) . '</td></tr>';
    }
    $html .= '</table><p>Reply to this email to contact the applicant. JSON and CSV copies are attached for review.</p>';
    $html .= '<p>This submission contains personal information. Share it only with the people responsible for reviewing leadership expressions of interest.</p></body></html>';

    // php://memory never spills sensitive submission data to a temporary file.
    $csv = fopen('php://memory', 'r+');
    if ($csv === false) {
        throw new \RuntimeException('Unable to create the email attachment.');
    }
    fwrite($csv, "\xEF\xBB\xBF");
    fputcsv($csv, ['Field', 'Value'], ',', '"', '');
    foreach ($fields as $label => $value) {
        fputcsv($csv, [$label, csv_value($value)], ',', '"', '');
    }
    rewind($csv);
    $csvContent = stream_get_contents($csv);
    fclose($csv);
    if ($csvContent === false) {
        throw new \RuntimeException('Unable to read the email attachment.');
    }

    $attachments = [
        ['name' => 'leadership-expression-of-interest.json', 'type' => 'application/json', 'content' => json_encode($submission, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)],
        ['name' => 'leadership-expression-of-interest.csv', 'type' => 'text/csv', 'content' => $csvContent],
    ];
    $boundary = 'mulembe_eoi_' . bin2hex(random_bytes(16));
    $headers = [
        'From: Mulembe Community NSW <' . SENDER . '>',
        'Reply-To: ' . $submission['email'],
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
    ];
    $message = '--' . $boundary . "\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $message .= chunk_split(base64_encode($html));
    foreach ($attachments as $attachment) {
        $message .= '--' . $boundary . "\r\n";
        $message .= 'Content-Type: ' . $attachment['type'] . '; charset=UTF-8; name="' . $attachment['name'] . '"' . "\r\n";
        $message .= 'Content-Disposition: attachment; filename="' . $attachment['name'] . '"' . "\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode($attachment['content']));
    }
    $message .= '--' . $boundary . "--\r\n";

    return [
        'to' => RECIPIENT,
        'subject' => 'New Mulembe leadership expression of interest',
        'message' => $message,
        'headers' => implode("\r\n", $headers),
    ];
}

function process_request(array $server, string $raw, ?callable $sendMail = null): array
{
    if (($server['REQUEST_METHOD'] ?? '') !== 'POST') {
        return response(405, 'Please submit this form using POST.');
    }
    if (strlen($raw) > MAX_BODY_BYTES || (isset($server['CONTENT_LENGTH']) && (int) $server['CONTENT_LENGTH'] > MAX_BODY_BYTES)) {
        return response(413, 'Your submission is too large. Please shorten the form entries and try again.');
    }
    $contentType = strtolower(trim(explode(';', $server['CONTENT_TYPE'] ?? '')[0]));
    if ($contentType !== 'application/json') {
        return response(415, 'Please submit the form as JSON.');
    }
    try {
        $decoded = json_decode($raw, false, 16, JSON_THROW_ON_ERROR);
    } catch (\JsonException $exception) {
        return response(400, 'The submission could not be read. Please check the form and try again.');
    }
    if (!$decoded instanceof \stdClass) {
        return response(400, 'The submission must be a JSON object.');
    }
    $validated = validate(get_object_vars($decoded));
    if ($validated['errors'] !== []) {
        return response(422, 'Please correct the highlighted fields before submitting.', $validated['errors']);
    }

    try {
        $mail = email($validated['submission']);
        $sendMail = $sendMail ?? static function (string $to, string $subject, string $message, string $headers): bool {
            // mail() only confirms acceptance by the host mail service, not inbox delivery.
            return @mail($to, $subject, $message, $headers);
        };
        $accepted = $sendMail($mail['to'], $mail['subject'], $mail['message'], $mail['headers']);
    } catch (\Throwable $exception) {
        $accepted = false;
    }
    if ($accepted !== true) {
        return response(503, 'We could not send your expression of interest. Please try again, or contact ' . RECIPIENT . '.');
    }
    return response(200, 'Your expression of interest has been submitted for review.');
}

function serve(): void
{
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    // Stop reading at the limit plus one byte; larger requests cannot fill memory.
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    $result = process_request($_SERVER, $raw === false ? '' : $raw);
    if ($result['status'] === 405) {
        header('Allow: POST');
    }
    http_response_code($result['status']);
    echo json_encode($result['body'], JSON_UNESCAPED_UNICODE);
}

// Tests can include these functions without making HTTP requests or sending mail.
if (!defined('MULEMBE_EOI_LIBRARY_ONLY')) {
    serve();
}
