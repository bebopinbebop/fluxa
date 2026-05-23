export type EditableProfileInput = {
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
};

const phonePattern = /^\+?[0-9\s().-]{7,20}$/;

export function validateEditableProfile(input: EditableProfileInput) {
  const name = input.name.trim();
  const dateOfBirth = input.dateOfBirth.trim();
  const phoneNumber = input.phoneNumber.trim();

  if (!name) {
    return 'Name cannot be empty.';
  }

  if (!isValidDateOfBirth(dateOfBirth)) {
    return 'Enter a valid date of birth in YYYY-MM-DD format.';
  }

  if (!phonePattern.test(phoneNumber)) {
    return 'Enter a valid phone number.';
  }

  return null;
}

export function isValidDateOfBirth(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  const [year, month, day] = value.split('-').map(Number);
  const today = new Date();

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day &&
    parsed < today &&
    year > 1900
  );
}
