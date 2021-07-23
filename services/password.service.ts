import { pbkdf2Sync, randomBytes } from "crypto";
import { LeanUserDocument } from "../db/types";
class PasswordService {
  getRandomSalt = () => {
    return randomBytes(16).toString("hex");
  };

  getSaltAndPassword = (
    password: string,
    salt?: string
  ): { salt: string; hashedPassword: string } => {
    if (!salt) {
      salt = this.getRandomSalt();
    }
    const hashedPassword = pbkdf2Sync(password, salt, 1, 12, "sha256").toString(
      "hex"
    );
    return { salt, hashedPassword };
  };

  isValid = (password: string, user: LeanUserDocument) => {
    const saltAndPassword = this.getSaltAndPassword(password, user.salt);
    if (saltAndPassword.hashedPassword === user.password) {
      return true;
    }
    return false;
  };
}

export default new PasswordService();
