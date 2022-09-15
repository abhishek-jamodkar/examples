 // The Auth0 client, initialized in configureClient()
 let auth0 = null;

 /**
  * Starts the authentication flow
  */
 const redirectLogin = async(targetUrl, email) => {
     try {
         console.log("Logging in", targetUrl);

         const options = {
             redirect_uri: window.location.origin,
             login_hint: email

         };



         if (targetUrl) {
             options.appState = { targetUrl };
         }

         await auth0.loginWithRedirect(options);
     } catch (err) {
         console.log("Log in failed", err);
     }
 };


 /**
  * Starts the authentication flow for scoped calls
  */
 const redirectLoginWithScopes = async(targetUrl) => {
     try {
         console.log("Logging in", targetUrl);

         const options = {
             redirect_uri: window.location.origin, // only options outside authorizeOptions are AppState and redirect_URI
             //authorizeOptions: {
             //scope: "read:current_user", //not all scopes from management APIs can be requested in redirect flow. check https://auth0.com/docs/secure/tokens/access-tokens/get-management-api-tokens-for-single-page-applications
             //audience: "https://abhishekj-cacu-demo.us.auth0.com/api/v2/"
             // }
         };

         if (targetUrl) {
             options.appState = { targetUrl };
         }

         await auth0.loginWithRedirect(options);
     } catch (err) {
         console.log("Log in failed", err);
     }
 };


 /**
  * Starts the authentication flow for scoped calls
  */
 const loginPopUp = async(targetUrl) => {
     try {
         console.log("Logging in", targetUrl);

         const options = {
             redirect_uri: window.location.origin,
             //authorizeOptions: {
             // scope: "read:current_user", //not all scopes from management APIs can be requested in redirect flow. check https://auth0.com/docs/secure/tokens/access-tokens/get-management-api-tokens-for-single-page-applications
             //audience: "https://abhishek-customers.us.auth0.com/api/v2/"
             // }

         };

         if (targetUrl) {
             options.appState = { targetUrl };
         }

         await auth0.loginWithPopup(options);
     } catch (err) {
         console.log("Log in failed", err);
     }
 };





 /**
  * Executes the logout flow
  */
 const logout = () => {
     try {
         console.log("Logging out");
         auth0.logout({
             returnTo: window.location.origin
         });
     } catch (err) {
         console.log("Log out failed", err);
     }
 };

 /**
  * Retrieves the auth configuration from the server
  */
 const fetchAuthConfig = () => fetch("/auth_config.json");

 /**
  * Initializes the Auth0 client
  */
 const configureClient = async() => {
     const response = await fetchAuthConfig();
     const config = await response.json();

     auth0 = await createAuth0Client({
         domain: config.domain,
         client_id: config.clientId,
         // display: config.display,
         // prompt: config.prompt,
         scope: config.scope,
         audience: config.audience,
         prompt: config.prompt
     });
 };

 /**
  * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
  * is prompted to log in
  * @param {*} fn The function to execute if the user is logged in
  */
 const requireAuth = async(fn, targetUrl) => {
     const isAuthenticated = await auth0.isAuthenticated();

     if (isAuthenticated) {
         return fn();
     }

     return login_redirect(targetUrl);
 };

 // Will run when page finishes loading
 window.onload = async() => {
     await configureClient();

     // If unable to parse the history hash, default to the root URL
     if (!showContentFromUrl(window.location.pathname)) {
         showContentFromUrl("/");
         window.history.replaceState({ url: "/" }, {}, "/");
     }

     const bodyElement = document.getElementsByTagName("body")[0];

     // Listen out for clicks on any hyperlink that navigates to a #/ URL
     bodyElement.addEventListener("click", (e) => {
         if (isRouteLink(e.target)) {
             const url = e.target.getAttribute("href");

             if (showContentFromUrl(url)) {
                 e.preventDefault();
                 window.history.pushState({ url }, {}, url);
             }
         }
     });

     const isAuthenticated = await auth0.isAuthenticated();

     if (isAuthenticated) {
         console.log("> User is authenticated");
         window.history.replaceState({}, document.title, window.location.pathname);
         updateUI();
         return;
     }

     console.log("> User not authenticated");

     const query = window.location.search;
     const shouldParseResult = query.includes("code=") && query.includes("state=");

     if (shouldParseResult) {
         console.log("> Parsing redirect");
         try {
             const result = await auth0.handleRedirectCallback();
             console.log("result :", result);

             if (result.appState && result.appState.targetUrl) {
                 showContentFromUrl(result.appState.targetUrl);
             }

             console.log("Logged in!");
         } catch (err) {
             console.log("Error parsing redirect:", err);
         }

         window.history.replaceState({}, document.title, "/");
     }

     updateUI();
 };
