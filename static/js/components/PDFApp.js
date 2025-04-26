// static/js/components/PDFApp.js

// Main component for PDF Reader landing page
class PDFApp extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        appInfo: null,
        loading: true
      };
    }
  
    componentDidMount() {
      // Optional: Fetch app info from backend
      fetch('/api/pdf-info')
        .then(response => response.json())
        .then(data => {
          this.setState({ appInfo: data, loading: false });
        })
        .catch(error => {
          console.error('Error fetching app info:', error);
          this.setState({ loading: false });
        });
    }
  
    render() {
      return (
        <div className="pdf-app">
          <div className="welcome-card">
            <h1>Welcome to PDF_Reader</h1>
            <div className="pdf-icon">📄</div>
            <p className="tagline">Your simple solution for PDF viewing and management</p>
            
            {this.state.appInfo && (
              <div className="features">
                <h3>Features:</h3>
                <ul>
                  {this.state.appInfo.capabilities.map((capability, index) => (
                    <li key={index}>{capability}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button className="start-btn" onClick={() => window.location.href = "/upload"}>
  Get Started
</button>
          </div>
        </div>
      );
    }
  }

  