export const NEW_PASSWORD_MIN_LENGTH = 12;
export const NEW_PASSWORD_MAX_LENGTH = 128;

export function newPasswordError(password: string) {
  if (password.length < NEW_PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${NEW_PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (password.length > NEW_PASSWORD_MAX_LENGTH) {
    return `A senha deve ter no máximo ${NEW_PASSWORD_MAX_LENGTH} caracteres.`;
  }
  return null;
}
