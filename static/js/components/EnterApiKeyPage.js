class EnterApiKeyPage extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        apiKey: "",
        status: null
      };
    }
  
    handleChange = (e) => {
      this.setState({ apiKey: e.target.value });
    };
  
    handleSubmit = () => {
      if (!this.state.apiKey) {
        alert("Please enter your API key.");
        return;
      }
  
      fetch('/api/store-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: this.state.apiKey })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          this.setState({ status: "API key saved successfully!" });
        } else {
          this.setState({ status: "Error saving API key." });
        }
      })
      .catch(err => {
        console.error("Error storing API key:", err);
        this.setState({ status: "Server error." });
      });
    };
  
    render() {
      return (
        <div className="enter-api-key-page">
          <h2>Enter Your API Key</h2>
          <p>This key will be securely linked to your Google account.</p>
          <input
            type="text"
            placeholder="Enter your API key"
            value={this.state.apiKey}
            onChange={this.handleChange}
          />
          <button onClick={this.handleSubmit}>Submit</button>
          {this.state.status && <p className="status-message">{this.state.status}</p>}
        </div>
      );
    }
  }
  