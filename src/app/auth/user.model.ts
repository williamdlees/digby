export class User {
  constructor(
    public appProtected: boolean,
    public userName: string,
    private _accessToken: string,
    private _accessTokenExpirationDate: Date,
    private _refreshToken: string,
    private _refreshTokenExpirationDate: Date,
  ) {}

  get accessToken() {
    if (!this._accessTokenExpirationDate || new Date() > this._accessTokenExpirationDate) {
      console.log("access token expired in User");
      return null;
    }
    return this._accessToken;
  }

  get refreshToken() {
    if (!this._refreshTokenExpirationDate || new Date() > this._refreshTokenExpirationDate) {
      return null;
    }
    return this._refreshToken;
  }

  set accessTokenExpirationDate(xpDate) {
    this._accessTokenExpirationDate = xpDate;
  }

  set accessToken(token) {
    this._accessToken = token;
  }
}
