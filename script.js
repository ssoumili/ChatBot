
const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");



let userMessage = null;
let isResponseGenerating = false;


//API configuration  
const API_KEY = "AIzaSyDR92NsDvWSqP0ZGJSz3oTzArrbpDu6JeQ";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") || "dark_mode") === "light_mode";


    // apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode); 
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
     
    //Restore saved chats
    chatList.innerHTML = savedChats || ""; // Restores the chat history to the chat window.
    
    document.body.classList.toggle("hide-header", savedChats); 
    chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the buttom to ensure recent message is visible

}

const createMessageElement=(content, ...classes) => {   //...multiple class to be passed as argument
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}


// show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currenWordIndex=0;

    const typingInterval = setInterval(() => {
         //Append each word to the text element with a space
        textElement.innerText += (currenWordIndex === 0 ? '' : ' ') + words[currenWordIndex];
       
        incomingMessageDiv.querySelector(".icon").classList.add("hide"); //hides copy icon
        
        
        //If all words are displayed       
        if(currenWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");  //showing copy icon  after the typing effect is complete.
            localStorage.setItem("savedChats", chatList.innerHTML) //save chats to local storage
           
        }
        chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom
        currenWordIndex++;
    }, 75);
}



//Fetch responses from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    const loadingIndicator = incomingMessageDiv.querySelector(".loading-indicator");
    //const textElement = incomingMessageDiv.querySelector(".text"); //get text element
// Send a POST request to the API with the user's message
    try {

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{text: userMessage}]
            }]
        })
      });


      const data = await response.json();
      if(!response.ok) throw new Error(data.error.message);

      
      //Get the API response text and remove asteroids from it
     // const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');  error
     //const apiResponse = data?.candidates[0].content.replace(/\*\*(.*?)\*\*/g, '$1');
     const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1') || "No response";
     loadingIndicator.style.display = 'none';
     showTypingEffect(apiResponse, textElement, incomingMessageDiv);
     
    } catch (error){
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
       //console.log(error); 
    
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
    
}

// Show a loading animation waiting for API
const showLoadingAnimation = () =>{
    const html= `<div class="message-content">
                <img src="gemini.svg" alt="Gemini Image" class="avatar">  
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
                </div>
            
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

const incomingMessageDiv = createMessageElement(html, "incoming", "loading");  
chatList.appendChild(incomingMessageDiv);

chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom
generateAPIResponse(incomingMessageDiv);

}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText= "done"; //show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); //Revert icon after 1 second 
    }
    

// Handle sending outgoing chat messages
const handleOutgoingChat = () =>{
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return;  // Exit if there is no message

    isResponseGenerating = true;

    const html = `<div class="message-content">
                    <img src="user.jpg" alt="User Image" class="avatar">  
                    <p class="text"></p>
                  </div>`;
//}
    const outgoingMessageDiv = createMessageElement(html, "outgoing");   
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);     

    typingForm.reset(); // Clear input field
    chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the buttom
    document.body.classList.add("hide-header"); // to hide the header once chat starts
    setTimeout(showLoadingAnimation, 500); // Show loading animation with a delay
}

suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();

    });
})

// toggle between light and dark theme
   
toggleThemeButton.addEventListener("click", () => {
   const isLightMode = document.body.classList.toggle("light_mode");
   localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
   toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

//Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if(confirm("Are you sure you want to delete messages?")) {
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
})

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});


