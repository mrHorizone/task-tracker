export interface AuthResult {
    accessToken: string;
    user: {
        id: number;
        login: string;
    };
}
