import { GoogleLogin, MicrosoftLogin, TogglePasswordVisibility } from "../../lib/functions/functions.js";

const login = (() => {
    const init = () => {
      GoogleLogin();
      MicrosoftLogin();
      $(".password-toggle").on("click", () => {
        TogglePasswordVisibility(".password-field", ".password-toggle")
      });
    };
    return {
      init,
    };
  })();
  
  export default login;