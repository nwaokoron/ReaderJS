
const url = 'http://localhost:5000/readoutloud' // "https://reader-atmfbi2wwq-wl.a.run.app/readoutloud"; //"http://localhost:5000/readoutloud" local backend testing change to DEV to test on the dev env backend server

const audioElement = new Audio();
audioElement.controls = true;
audioElement.id = "audio-element";
document.body.appendChild(audioElement);


function extractArticleContent() {
  html = document.body.innerHTML;
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove scripts and styles
  const scripts = doc.querySelectorAll("script");
  scripts.forEach(script => script.remove());
  const styles = doc.querySelectorAll("style");
  styles.forEach(style => style.remove());

  // Identify potential article element using heuristics
  let articleElement = identifyArticleElement(doc);

  // Handle missing article element gracefully
  if (!articleElement) {
    console.error("No suitable article element found.");
    return;
  }

  // Remove unnecessary elements
  const unwantedTags = ["header", "footer", "aside", "nav", "form"];
  unwantedTags.forEach(tag => {
    const elements = articleElement.querySelectorAll(tag);
    elements.forEach(element => element.remove());
  });

  // Clean and format content
  const textContent = articleElement.textContent.trim();
  const cleanText = textContent.replace(/\s+/g, " ").replace(/[\r\n]+/g, "\n"); // Replace multiple whitespaces and newlines

  // Return the extracted content
  return cleanText;
}

function identifyArticleElement(doc) {
  // Try multiple strategies to find the most likely article element:

  // 1. Check for dedicated article tag
  let articleElement = doc.querySelector("article");

  // 2. Analyze main content based on size and text-to-code ratio
  if (!articleElement) {
    const candidates = doc.querySelectorAll("body > *:not([style*='display:none'])");
    let bestCandidate = null;
    let bestScore = 0;
    candidates.forEach(candidate => {
      const textLength = candidate.textContent.trim().length;
      const codeLength = candidate.querySelectorAll("code").length;
      const score = textLength / (codeLength + 1); // Penalize elements with many code blocks
      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    });
    articleElement = bestCandidate;
  }

  // 3. Use common class names as fallback (optional)
  if (!articleElement) {
    const candidateClasses = [".article", ".post-content", ".content"];
    for (const className of candidateClasses) {
      articleElement = doc.querySelector(className);
      if (articleElement) {
        break;
      }
    }
  }

  return articleElement;
}



// Add an event listener for when the audio element is hovered over
audioElement.addEventListener("mouseover", () => {
  // Extract the article content from the page
  const content = extractArticleContent();
  console.log(content);

  // Create a new request object
  const formData = new FormData();

  const request = new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({'articleContent': content, 'url': window.location.href}),
  });

  // Fetch the response from the server
  fetch(request)
  .then(response => {
    console.log(response);
    return response.json();
  })
  .then(data => {
    console.log(data)
    if(data.filename) {
      audioElement.src = data.filename;
      audioElement.play();
    }
    else {
      console.log("No data")
    }
  })
  .catch(error => console.log('Error:', error));
});
