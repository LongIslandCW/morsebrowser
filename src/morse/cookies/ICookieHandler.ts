export interface ICookieHandler {
    handleCookies: (cookies: Array<any>) => void
    handleCookie: (cookie: string) => void
}
