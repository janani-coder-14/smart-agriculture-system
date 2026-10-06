// ======================================================
// AUTH.JS
// Smart Agriculture
// Handles Farmer Login and Registration
// ======================================================


// ======================================================
// FORM REFERENCES
// ======================================================

const loginForm = document.getElementById('login-form');

const registerForm =
  document.getElementById('register-form');


// ======================================================
// FARMER LOGIN
// ======================================================

if (loginForm) {

  loginForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    // Clear previous errors/messages
    clearErrors(loginForm);
    hideMessage('form-message');


    // ------------------------------------------
    // GET LOGIN VALUES
    // ------------------------------------------

    const mobile =
      document.getElementById('mobile').value.trim();

    const password =
      document.getElementById('password').value;


    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    const errors = {};


    if (mobile === '') {

      errors.mobile =
        'Mobile number is required';

    }


    if (password === '') {

      errors.password =
        'Password is required';

    }


    // Show validation errors
    if (Object.keys(errors).length) {

      return showFieldErrors(
        loginForm,
        errors
      );

    }


    // ------------------------------------------
    // DISABLE LOGIN BUTTON
    // ------------------------------------------

    const btn =
      document.getElementById('submit-btn');

    if (btn) {
      btn.disabled = true;
    }


    // ------------------------------------------
    // LOGIN REQUEST
    // ------------------------------------------

    try {

      const { status, data } =

        await api(
          'POST',
          '/api/login',
          {
            mobile: mobile,
            password: password
          }
        );


      // ==========================================
      // LOGIN SUCCESS
      // ==========================================

      if (status === 200) {

        console.log(
          'Login successful:',
          data
        );


        // --------------------------------------
        // SAVE FARMER ID
        // --------------------------------------

        if (data.farmer && data.farmer.id) {

          localStorage.setItem(
            'farmerId',
            data.farmer.id
          );

        }


        // --------------------------------------
        // SAVE COMPLETE FARMER INFORMATION
        // --------------------------------------

        if (data.farmer) {

          localStorage.setItem(
            'farmer',
            JSON.stringify(data.farmer)
          );

        }


        // --------------------------------------
        // REDIRECT TO FARMER DASHBOARD
        // --------------------------------------

        window.location.href =
          'dashboard.html';

      }


      // ==========================================
      // LOGIN FAILED
      // ==========================================

      else {

        if (data.errors) {

          showFieldErrors(
            loginForm,
            data.errors
          );

        }


        showMessage(
          'form-message',
          data.message || 'Login failed',
          false
        );

      }


    } catch (err) {

      console.error(
        'Login error:',
        err
      );


      showMessage(
        'form-message',
        'Cannot reach the server. Is it running?',
        false
      );

    } finally {

      if (btn) {
        btn.disabled = false;
      }

    }

  });

}


// ======================================================
// FARMER REGISTRATION
// ======================================================

if (registerForm) {

  registerForm.addEventListener(
    'submit',
    async (e) => {

      e.preventDefault();


      // Clear previous errors/messages
      clearErrors(registerForm);
      hideMessage('form-message');


      // ------------------------------------------
      // GET REGISTRATION VALUES
      // ------------------------------------------

      const values = {

        name:
          document
            .getElementById('name')
            .value,

        mobile:
          document
            .getElementById('mobile')
            .value,

        email:
          document
            .getElementById('email')
            .value,

        password:
          document
            .getElementById('password')
            .value,

        confirmPassword:
          document
            .getElementById('confirmPassword')
            .value

      };


      // ------------------------------------------
      // VALIDATION
      // ------------------------------------------

      const errors = {};


      [
        'name',
        'mobile',
        'email',
        'password'
      ].forEach((field) => {

        const msg =
          rules[field](values[field]);


        if (msg) {

          errors[field] =
            msg;

        }

      });


      // Confirm password
      if (
        values.confirmPassword === ''
      ) {

        errors.confirmPassword =
          'Please confirm your password';

      }

      else if (
        values.confirmPassword !==
        values.password
      ) {

        errors.confirmPassword =
          'Passwords do not match';

      }


      // Show errors
      if (Object.keys(errors).length) {

        return showFieldErrors(
          registerForm,
          errors
        );

      }


      // ------------------------------------------
      // DISABLE BUTTON
      // ------------------------------------------

      const btn =
        document.getElementById('submit-btn');

      if (btn) {
        btn.disabled = true;
      }


      // ------------------------------------------
      // REGISTRATION REQUEST
      // ------------------------------------------

      try {

        const { status, data } =

          await api(
            'POST',
            '/api/register',
            {

              name:
                values.name.trim(),

              mobile:
                values.mobile.trim(),

              email:
                values.email.trim(),

              password:
                values.password,

              confirmPassword:
                values.confirmPassword

            }
          );


        // ==========================================
        // REGISTRATION SUCCESS
        // ==========================================

        if (status === 201) {

          registerForm.reset();


          showMessage(
            'form-message',
            data.message +
            ' Redirecting to login...',
            true
          );


          setTimeout(
            () => {

              window.location.href =
                'index.html';

            },
            2000
          );

        }


        // ==========================================
        // REGISTRATION FAILED
        // ==========================================

        else {

          if (data.errors) {

            showFieldErrors(
              registerForm,
              data.errors
            );

          }


          showMessage(
            'form-message',
            data.message ||
            'Registration failed',
            false
          );

        }


      } catch (err) {

        console.error(
          'Registration error:',
          err
        );


        showMessage(
          'form-message',
          'Cannot reach the server. Is it running?',
          false
        );

      } finally {

        if (btn) {
          btn.disabled = false;
        }

      }

    }
  );

}


// ======================================================
// LOGOUT
// ======================================================

function logout() {

  // Remove farmer login information

  localStorage.removeItem(
    'farmerId'
  );

  localStorage.removeItem(
    'farmer'
  );


  // Return to login page

  window.location.href =
    'index.html';
}