import * as otpGenerator from "otp-generator";

export const generateOTP = async (): Promise<string> => {
  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};
