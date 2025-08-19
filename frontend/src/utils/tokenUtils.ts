// JWT Token utilities
export interface JWTPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname": string;
  "role_table_id": string;
  exp: number;
  iss: string;
  aud: string;
}

export interface DecodedToken {
  userId: string;
  username: string;
  role: string;
  role_table_id?: string; 
  givenname: string;
  exp: number;
  iss: string;
  aud: string;
}

export class TokenUtils {
  /**
   * Decode JWT token without verification (client-side only)
   */
  static decodeToken(token: string): DecodedToken | null {
    try {
      // Split token into parts
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      // Decode payload (base64url)
      const payload = parts[1];
      const decodedPayload = this.base64UrlDecode(payload);
      const parsedPayload: JWTPayload = JSON.parse(decodedPayload);

      return {
        userId:
          parsedPayload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ],
        username:
          parsedPayload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
          ],
        role: parsedPayload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ],
        role_table_id: parsedPayload["role_table_id"],
        givenname: parsedPayload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
        ],
        exp: parsedPayload.exp,
        iss: parsedPayload.iss,
        aud: parsedPayload.aud,
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  /**
   * Get role from token
   */
  static getRoleFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.role || null;
  }

  static getRoleTableIdFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.role_table_id || null;
  }

  /**
   * Get user ID from token
   */
  static getUserIdFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.userId || null;
  }

  /**
   * Get username from token
   */
  static getUsernameFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.username || null;
  }

  static getFullNameFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.givenname || null;
  }

  /**
   * Base64URL decode (used in JWT)
   */
  private static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }

    try {
      return decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (error) {
      throw new Error("Invalid base64 encoding");
    }
  }
  /**
   * Save token for normal login
   */
  static saveLoginToken(token: string, refreshToken?: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return false;

      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      window.dispatchEvent(new Event('authChange'));

      return true;
    } catch {
      console.error("Error saving login token");
      return false;
    }
  }
  /**
   * Save token for Google OAuth
   */
  static saveGoogleAuthToken(token: string, refreshToken?: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return false;

      localStorage.setItem("authToken", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      window.dispatchEvent(new Event('authChange'));

      return true;
    } catch {
      console.error("Error saving Google auth token");
      return false;
    }
  }
  /**
   * Get user data from localStorage (decode from token)
   */
  static getUserData(): {
    token: string | null;
    userId: string | null;
    username: string | null;
    fullName: string | null;
    role: string | null;
    role_table_id?: string | null;
    refreshToken: string | null;
  } {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (!token) {
      return {
        token: null,
        userId: null,
        username: null,
        fullName: null,
        role: null,
        role_table_id: null,
        refreshToken
      };
    }

    // Decode token to get user info
    const decoded = this.decodeToken(token);
    if (!decoded) {
      return {
        token,
        userId: null,
        fullName: null,
        username: null,
        role: null,
        role_table_id: null,
        refreshToken
      };
    }

    return {
      token,
      userId: decoded.userId,
      username: decoded.username,
      fullName: decoded.givenname,
      role: decoded.role,
      role_table_id: decoded.role_table_id,
      refreshToken
    };
  }
  /**
   * Clear all token data
   */
  static clearTokenData(): void {
    localStorage.removeItem("token");        // Normal login
    localStorage.removeItem("authToken");    // Google OAuth
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("avatar");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    window.dispatchEvent(new Event('authChange'));
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  static getActiveToken(): string | null {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  }
}