const { serialize } = require("cookie");
const setTokenCookie = (res, token) => {
  res.setHeader("Set-Cookie", [
    serialize("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }),
  ]);
};

const clearTokenCookie = (res) => {
  res.setHeader("Set-Cookie", [
    serialize("token", "", {

      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    }),
  ]);
};

module.exports = { setTokenCookie, clearTokenCookie };
