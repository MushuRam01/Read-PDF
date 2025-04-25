class UploadPage extends React.Component {
    constructor(props) {
      super(props);
      this.state = { selectedFile: null };
    }
  
    handleFileChange = (event) => {
      this.setState({ selectedFile: event.target.files[0] });
    };
  
    handleUpload = () => {
        if (!this.state.selectedFile) {
          alert("Please select a PDF first.");
          return;
        }
      
        const formData = new FormData();
        formData.append('pdf', this.state.selectedFile);

      
        fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === "success") {
              window.location.href = `/viewer/${encodeURIComponent(data.filename)}`;
            } else {
              alert("Upload failed.");
            }
          })
          .catch(err => {
            console.error("Upload error:", err);
            alert("Upload failed.");
          });
      };
      
  
    render() {
      return (
        <div className="upload-page">
          <h2>Upload a PDF</h2>
          <input type="file" accept="application/pdf" onChange={this.handleFileChange} />
          <button onClick={this.handleUpload}>Upload</button>
        </div>
      );
    }
  }
  