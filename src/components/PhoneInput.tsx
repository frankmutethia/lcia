import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRIES = [
  { code: "+61", name: "Australia", flag: "🇦🇺", example: "412 345 678" },
  { code: "+254", name: "Kenya", flag: "🇰🇪", example: "712 345 678" },
  { code: "+256", name: "Uganda", flag: "🇺🇬", example: "712 345 678" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿", example: "712 345 678" },
];
const OTHER = "other";

// Splits a stored value such as "+254 712345678" back into its country code and number.
function parse(value: string) {
  const known = COUNTRIES.find((c) => value.startsWith(c.code + " "));
  if (known) return { country: known.code, customCode: "", local: value.slice(known.code.length + 1) };
  const custom = value.match(/^(\+\d{1,4})\s+(.*)$/);
  if (custom) return { country: OTHER, customCode: custom[1], local: custom[2] };
  return { country: COUNTRIES[0].code, customCode: "", local: value };
}

// "+61" plus "0412 345 678" becomes "+61 412345678": the trunk 0 is dropped after a country code.
function combine(code: string, local: string) {
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  const cleanCode = "+" + code.replace(/\D/g, "");
  return cleanCode.length > 1 ? `${cleanCode} ${digits}` : digits;
}

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  /** Classes for the wrapper, e.g. spacing. */
  className?: string;
  /** The form's own input classes, applied to the country picker and the number field. */
  fieldClassName?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export default function PhoneInput({
  id,
  name,
  value,
  onChange,
  required,
  className,
  fieldClassName,
  ...aria
}: PhoneInputProps) {
  const [{ country, customCode, local }, setParts] = useState(() => parse(value));

  // Clear the field when the form resets.
  useEffect(() => {
    if (value === "") setParts((p) => (p.local ? { ...p, local: "" } : p));
  }, [value]);

  const update = (next: Partial<{ country: string; customCode: string; local: string }>) => {
    const parts = { country, customCode, local, ...next };
    setParts(parts);
    onChange(combine(parts.country === OTHER ? parts.customCode : parts.country, parts.local));
  };

  const selected = COUNTRIES.find((c) => c.code === country);
  const example = selected?.example ?? "Phone number";

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Same dropdown as the form's other selects, so it looks the same on every device. */}
      <Select value={country} onValueChange={(next) => update({ country: next })}>
        <SelectTrigger aria-label="Country code" className={cn(fieldClassName, "w-[6.75rem] shrink-0 gap-1")}>
          <SelectValue>{selected ? `${selected.flag} ${selected.code}` : "Other"}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" className="min-w-[12rem]">
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} {c.name} {c.code}
            </SelectItem>
          ))}
          <SelectItem value={OTHER}>Other country</SelectItem>
        </SelectContent>
      </Select>
      {country === OTHER && (
        <input
          aria-label="Country code, for example +44"
          inputMode="tel"
          placeholder="+44"
          maxLength={5}
          required={required}
          value={customCode}
          onChange={(e) => update({ customCode: e.target.value })}
          className={cn(fieldClassName, "w-20 shrink-0")}
        />
      )}
      <input
        id={id}
        name={name}
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        required={required}
        maxLength={20}
        placeholder={example}
        value={local}
        onChange={(e) => update({ local: e.target.value })}
        className={cn(fieldClassName, "min-w-0 flex-1")}
        {...aria}
      />
    </div>
  );
}
