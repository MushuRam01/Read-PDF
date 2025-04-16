// static/js/components/PDFViewer.js

class PageCommentSidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      comment: ""
    };
  }

  componentDidUpdate(prevProps) {
    // Fetch new comments when the page changes
    if (prevProps.currentPage !== this.props.currentPage && this.props.currentPage > 0) {
      this.fetchAIComment();
    }
  }

  fetchAIComment = () => {
    const { pdfText, currentPage } = this.props;
    
    if (!pdfText || !pdfText[currentPage]) {
      this.setState({ comment: "No text available for this page." });
      return;
    }
    
    this.setState({ loading: true });
    
    // Make API call to Together.ai
    fetch('/api/get-ai-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageText: pdfText[currentPage],
        pageNumber: currentPage
      })
    })
    .then(response => response.json())
    .then(data => {
      this.setState({ 
        comment: data.comment,
        loading: false 
      });
    })
    .catch(error => {
      console.error('Error fetching AI comment:', error);
      this.setState({ 
        comment: "Error loading AI comment. Please try again.",
        loading: false 
      });
    });
  }

  render() {
    return (
      <div className="page-comment-sidebar">
        <h3>AI Assistant Comments</h3>
        <div className="page-info">
          <span>Page {this.props.currentPage} of {this.props.totalPages}</span>
        </div>
        <div className="comment-content">
          {this.state.loading ? (
            <div className="loading-spinner">Loading comment...</div>
          ) : (
            <div className="comment-text">{this.state.comment}</div>
          )}
        </div>
      </div>
    );
  }
}

class PDFViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 0,
      totalPages: 0,
      pdfText: {},
      pdfLoaded: false
    };
  }

  componentDidMount() {
    const url = `/uploads/${this.props.fileName}`;
    this.loadPDF(url);
  }

  loadPDF = (url) => {
    const loadingTask = window['pdfjsLib'].getDocument(url);
    loadingTask.promise.then(pdf => {
      this.setState({ totalPages: pdf.numPages });
      const viewer = document.getElementById("pdf-view");
      
      // Clear viewer before adding new pages
      viewer.innerHTML = '';
      
      // Store page text for AI processing
      const pageTextPromises = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        pageTextPromises.push(
          pdf.getPage(pageNum).then(page => {
            return page.getTextContent().then(textContent => {
              const pageText = textContent.items.map(item => item.str).join(' ');
              return { pageNum, pageText };
            });
          })
        );
        
        pdf.getPage(pageNum).then(page => {
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.setAttribute('data-page-number', pageNum);
          
          // Add observer to detect when page is in view
          this.addIntersectionObserver(canvas, pageNum);
          
          viewer.appendChild(canvas);

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          page.render(renderContext);
        });
      }
      
      // Collect all page text
      Promise.all(pageTextPromises).then(pageTexts => {
        const pdfText = {};
        pageTexts.forEach(item => {
          pdfText[item.pageNum] = item.pageText;
        });
        this.setState({ pdfText, pdfLoaded: true });
        
        // Set current page to 1 once PDF is loaded
        if (this.state.currentPage === 0) {
          this.setState({ currentPage: 1 });
        }
      });
    });
  }
  
  addIntersectionObserver = (element, pageNum) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setState({ currentPage: pageNum });
        }
      });
    }, { threshold: 0.5 }); // Element is considered "visible" when 50% in view
    
    observer.observe(element);
  }

  render() {
    return (
      <div className="pdf-container">
        <h2>Viewing: {this.props.fileName}</h2>
        <div className="pdf-content-wrapper">
          <div id="pdf-view" className="pdf-viewer"></div>
          {this.state.pdfLoaded && (
            <PageCommentSidebar 
              currentPage={this.state.currentPage}
              totalPages={this.state.totalPages}
              pdfText={this.state.pdfText}
            />
          )}
        </div>
      </div>
    );
  }
}