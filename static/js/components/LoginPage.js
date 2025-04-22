// static/js/components/LoginPage.js

class LoginPage extends React.Component {
    render() {
      return (
        <div className="login-page">
          <div className="login-card">
            <h2>Welcome to PDF_Reader</h2>
            <p>Login with your Google account to continue.</p>
            <button className="google-login-btn" onClick={() => window.location.href = "/login"}>
              Sign in with Google
            </button>
          </div>
        </div>
      );
    }
  }
  