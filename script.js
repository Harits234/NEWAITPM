document.addEventListener('DOMContentLoaded', () => {

    const chartImageInput = document.getElementById('chartImageInput');
    const fileUploadLabel = document.getElementById('fileUploadLabel');
    const fileUploadLabelSpan = fileUploadLabel.querySelector('span');
    const imagePreview = document.getElementById('imagePreview');
    const analysisForm = document.getElementById('analysisForm');
    const analyzeButton = document.querySelector('.analyze-button');
    
    const outputCard = document.querySelector('.output-card');
    const loader = document.getElementById('loader');
    const analysisResult = document.getElementById('analysisResult');
    const resultPosition = document.getElementById('resultPosition');
    const resultReasoning = document.getElementById('resultReasoning');

    // Function to handle file selection and preview
    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
                fileUploadLabel.classList.add('hidden');
            }
            
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
        }
    }

    // Event listener for file input change (click to upload)
    chartImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    // --- Drag and Drop functionality ---
    fileUploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadLabel.style.borderColor = 'var(--accent-color)';
        fileUploadLabel.style.backgroundColor = '#31313a';
    });

    fileUploadLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadLabel.style.borderColor = 'var(--border-color)';
        fileUploadLabel.style.backgroundColor = 'var(--primary-bg-color)';
    });

    fileUploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadLabel.style.borderColor = 'var(--border-color)';
        fileUploadLabel.style.backgroundColor = 'var(--primary-bg-color)';
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // Form submission handler
    analysisForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if image is uploaded
        if (imagePreview.classList.contains('hidden')) {
            alert('Please upload a chart image first.');
            return;
        }

        // Show output card and loader
        outputCard.classList.remove('hidden');
        loader.classList.remove('hidden');
        analysisResult.classList.add('hidden');
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Analyzing...';
        
        // Prepare data for API
        const formData = new FormData();
        formData.append('chartImage', chartImageInput.files[0]);
        formData.append('strategy', analysisForm.strategy.value);
        formData.append('timeframe', analysisForm.timeframe.value);

        try {
            // --- REAL AI API CALL ---
            // Replace '/api/analyze' with your actual backend API endpoint
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData 
                // Note: 'Content-Type' header is not needed; 
                // the browser sets it automatically for FormData
            });

            if (!response.ok) {
                // Handle server errors (e.g., 4xx, 5xx)
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Assuming the API returns a JSON object like:
            // { position: "BUY...", reason: "Analysis found..." }
            resultPosition.textContent = data.position;
            resultReasoning.textContent = data.reason;

            // Show results
            analysisResult.classList.remove('hidden');

        } catch (error) {
            // Handle network errors or errors from the server response
            console.error('Analysis failed:', error);
            resultPosition.textContent = 'Analysis Failed';
            resultReasoning.textContent = `An error occurred. Please check the console or try again later. Details: ${error.message}`;
            analysisResult.classList.remove('hidden');
        } finally {
            // Hide loader and re-enable button regardless of outcome
            loader.classList.add('hidden');
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze with AI';
        }
    });
});
