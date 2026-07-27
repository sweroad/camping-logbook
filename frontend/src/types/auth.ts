export interface UserOut {
  id: string;
  username: string;
  display_name: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}
