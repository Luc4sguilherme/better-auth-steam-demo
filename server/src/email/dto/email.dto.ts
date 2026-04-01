export interface UserEmailData {
  name: string;
  email: string;
}

export interface EmailVerificationDto {
  user: UserEmailData;
  url: string;
}

export interface ChangeEmailVerificationDto {
  user: Pick<UserEmailData, 'name'>;
  newEmail: string;
  url: string;
}

export interface PasswordResetDto {
  user: UserEmailData;
  url: string;
}

export interface DeleteAccountVerificationDto {
  user: UserEmailData;
  url: string;
}

export interface WelcomeEmailDto {
  user: UserEmailData;
}
