window.onscroll = function() {myFunction()};

function myFunction() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100;
  document.getElementById("myBar").style.width = scrolled + "%";
}


"use strict";

// This example uses the autocomplete feature of the Google Places API.
// It allows the user to find all hotels in a given place, within a given
// country. It then displays markers for all the hotels returned,
// with on-click details for each hotel.
// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBIwzALxUPNbatRBj3Xi1Uhp0fFzwWNBkE&libraries=places">
let map;
let places;
let infoWindow;
let markers = [];
let autocomplete;
const countryRestrict = {
  country: "us"
};
const MARKER_PATH =
  "https://developers.google.com/maps/documentation/javascript/images/marker_green";
const hostnameRegexp = new RegExp("^https?://.+?/");
const countries = {

  us: {
    center: {
      lat: 37.1,
      lng: -95.7
    },
    zoom: 3
  },
};

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: countries["us"].zoom,
    center: countries["us"].center,
    mapTypeControl: false,
    panControl: false,
    zoomControl: true,
    streetViewControl: true,
  });
  infoWindow = new google.maps.InfoWindow({
    content: document.getElementById("info-content")
  }); // Create the autocomplete object and associate it with the UI input control.
  // Restrict the search to the default country, and to place type "cities".

  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("autocomplete"),
    {
      types: ["(cities)"],
      componentRestrictions: countryRestrict
    }
  );
  places = new google.maps.places.PlacesService(map);
  autocomplete.addListener("place_changed", onPlaceChanged); // Add a DOM event listener to react when the user selects a country.

  document
    .getElementById("country")
    .addEventListener("change", setAutocompleteCountry);
} // When the user selects a city, get the place details for the city and
// zoom the map in on the city.

function onPlaceChanged() {
  const place = autocomplete.getPlace();

  if (place.geometry) {
    map.panTo(place.geometry.location);
  map.setZoom(12);
    search();
  } else {
    document.getElementById("autocomplete").placeholder = "Enter a city";
  }
} // Search for hotels in the selected city, within the viewport of the map.

function search() {
  const search = {
    bounds: map.getBounds(),
    query: "mental health resources",
    types: ["health"]
  };
  places.textSearch(search, (results, status, pagination) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      clearResults();
      clearMarkers(); // Create a marker for each hotel found, and
      // assign a letter of the alphabetic to each marker icon.

      for (let i = 0; i < results.length; i++) {
        const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
        const markerIcon = MARKER_PATH + markerLetter + ".png"; // Use marker animation to drop the icons incrementally on the map.

        markers[i] = new google.maps.Marker({
          position: results[i].geometry.location,
          animation: google.maps.Animation.DROP,
          icon: markerIcon
        }); // If the user clicks a hotel marker, show the details of that hotel
        // in an info window.

        markers[i].placeResult = results[i];
        google.maps.event.addListener(markers[i], "click", showInfoWindow);
        setTimeout(dropMarker(i), i * 100);
        addResult(results[i], i);
      }
    }
  });
}

function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  }

  markers = [];
} // Set the country restriction based on user input.
// Also center and zoom the map on the given country.

function setAutocompleteCountry() {
  const country = document.getElementById("country").value;

  if (country == "all") {
    autocomplete.setComponentRestrictions({
      country: []
    });
    map.setCenter({
      lat: 15,
      lng: 0
    });
    map.setZoom(2);
  } else {
    autocomplete.setComponentRestrictions({
      country: country
    });
    map.setCenter(countries[country].center);
    map.setZoom(countries[country].zoom);
  }

  clearResults();
  clearMarkers();
}

function dropMarker(i) {
  return function() {
    markers[i].setMap(map);
  };
}

function addResult(result, i) {
  const results = document.getElementById("results");
  const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
  const markerIcon = MARKER_PATH + markerLetter + ".png";
  const tr = document.createElement("tr");
  tr.style.backgroundColor = i % 2 === 0 ? "#F0F0F0" : "#FFFFFF";

  tr.onclick = function() {
    google.maps.event.trigger(markers[i], "click");
  };

  const iconTd = document.createElement("td");
  const nameTd = document.createElement("td");
  const icon = document.createElement("img");
  icon.src = markerIcon;
  icon.setAttribute("class", "placeIcon");
  icon.setAttribute("className", "placeIcon");
  const name = document.createTextNode(result.name);
  iconTd.appendChild(icon);
  nameTd.appendChild(name);
  tr.appendChild(iconTd);
  tr.appendChild(nameTd);
  results.appendChild(tr);
}

function clearResults() {
  const results = document.getElementById("results");

  while (results.childNodes[0]) {
    results.removeChild(results.childNodes[0]);
  }
} // Get the place details for a hotel. Show the information in an info window,
// anchored on the marker for the hotel that the user selected.

function showInfoWindow() {
  const marker = this;
  places.getDetails(
    {
      placeId: marker.placeResult.place_id
    },
    (place, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        return;
      }

      infoWindow.open(map, marker);
      buildIWContent(place);
    }
  );
} // Load the place information into the HTML elements used by the info window.

function buildIWContent(place) {
  document.getElementById("iw-icon").innerHTML =
    '<img class="hotelIcon" ' + 'src="' + place.icon + '"/>';
  document.getElementById("iw-url").innerHTML =
    '<b><a href="' + place.url + '">' + place.name + "</a></b>";
  document.getElementById("iw-address").textContent = place.vicinity;

  if (place.formatted_phone_number) {
    document.getElementById("iw-phone-row").style.display = "";
    document.getElementById("iw-phone").textContent =
      place.formatted_phone_number;
  } else {
    document.getElementById("iw-phone-row").style.display = "none";
  } // Assign a five-star rating to the hotel, using a black star ('&#10029;')
  // to indicate the rating the hotel has earned, and a white star ('&#10025;')
  // for the rating points not achieved.

  if (place.rating) {
    let ratingHtml = "";

    for (let i = 0; i < 5; i++) {
      if (place.rating < i + 0.5) {
        ratingHtml += "&#10025;";
      } else {
        ratingHtml += "&#10029;";
      }

      document.getElementById("iw-rating-row").style.display = "";
      document.getElementById("iw-rating").innerHTML = ratingHtml;
    }
  } else {
    document.getElementById("iw-rating-row").style.display = "none";
  } // The regexp isolates the first part of the URL (domain plus subdomain)
  // to give a short URL for displaying in the info window.

  if (place.website) {
    let fullUrl = place.website;
    let website = String(hostnameRegexp.exec(place.website));

    if (!website) {
      website = "http://" + place.website + "/";
      fullUrl = website;
    }

    document.getElementById("iw-website-row").style.display = "";
    document.getElementById("iw-website").textContent = website;
  } else {
    document.getElementById("iw-website-row").style.display = "none";
  }
}



//Quiz
const start = document.getElementById("start")
const quiz = document.getElementById("quiz")
const question = document.getElementById("question")
const choiceA = document.getElementById("A")
const choiceB = document.getElementById("B")
const choiceC = document.getElementById("C")
const counter = document.getElementById("counter")
const timeGauge = document.getElementById("timeGauge")
const progress = document.getElementById("progress")
const scoreDiv = document.getElementById("scoreContainer")




//create our questions
let questions = [

   {
        question : "Suicide is the 10th leading cause of death overall in the United States.",
        choiceA : "True",
        choiceB : "False",
        choiceC : "I Have No Idea",
        correct : "A"
    },
    {
        question : "Suicide is the _____ leading cause of death among young people ages 15 to 24 around the world.",
        choiceA : "2nd",
        choiceB : "4th",
        choiceC : "10th",
        correct : "A"
    },
    {
        question : "Females are ______ more likely to attempt suicide than males.",
        choiceA : "not",
        choiceB : "3 times",
        choiceC : "5 times",
        correct : "B"
    },
    {
        question : "Males are ______ more likely to die by suicide than females.",
        choiceA : "not",
        choiceB : "2 times",
        choiceC : "4 times",
        correct : "C"
    },
    {
        question : "Firearms accounted for more than half of all suicide deaths.",
        choiceA : "True",
        choiceB : "False",
        choiceC : "I have no Idea",
        correct : "A"
    },
    {
        question : "LGB kids are ______ more likely to attempt suicide than straight kids at some point in their life.",
        choiceA : "not",
        choiceB : "3 times",
        choiceC : "5 times",
        correct : "B"

    },
    {
        question : "Approximately, _______ Americans die by suicide every day.",
        choiceA : "33",
        choiceB : "42",
        choiceC : "123",
        correct : "C"
    },
    {
        question : "80%-90% of people that seek treatment for depression recover from therapy and/or medications.",
        choiceA : "True",
        choiceB : "False",
        choiceC : "I have no idea",
        correct : "A"
    },
    {
        question : "9 out of 10 people who attempt suicide and survive will not die by suicide at a later date.",
        choiceA : "True",
        choiceB : "False",
        choiceC : "I have no idea",
        correct : "A"
    },
]

//variables
const lastQuestionIndex = questions.length-1;
let runningQuestionIndex = 0;
let count = 0;
const questionTime = 10; // 10 seconds for every question
const gaugeWidth = 150; //150 pixels
const gaugeUnit = gaugeWidth / questionTime;
let TIMER;
let score = 0;

// function that renders question
function questionRender() {
    let q = questions[runningQuestionIndex];

    question.innerHTML = "<p>" + q.question + "</p>"
    choiceA.innerHTML = q.choiceA;
    choiceB.innerHTML = q.choiceB;
    choiceC.innerHTML = q.choiceC;
}
start.addEventListener("click", startQuiz );

//start quiz

//start quiz function
function startQuiz(){
    start.style.display = "none";
    questionRender();
    quiz.style.display = "block"
    progressRender();
    renderCounter();
    TIMER = setInterval(renderCounter, 1000); //1000ms = 1s
}

//function that renders progress
function progressRender() {
    for(let qIndex = 0; qIndex <= lastQuestionIndex; qIndex++){
        progress.innerHTML += "<div class='prog' id=" + qIndex +"> </div>";
    }
}

// function that creates counter
function renderCounter(){
    if (count <= questionTime ){
        counter.innerHTML = count;
        timeGauge.style.width = count * gaugeUnit + "px";
        count++;
    } else{
        count = 0;
        answerIsWrong();
        if(runningQuestionIndex < lastQuestionIndex){
            runningQuestionIndex++
            questionRender();
        } else{
            //end the quiz and show the score
            clearInterval(TIMER);
            scoreRender();
        }
    }}


// function that checks answer
function checkAnswer(answer){
    if (answer == questions[runningQuestionIndex].correct){
        // answer is correct
        score++
        //change progress color to green
        answerIsCorrect();
    } else{
        //answer is incorrect
        //change progress color to red
        answerIsWrong();

    }
    count = 0;
    if (runningQuestionIndex < lastQuestionIndex){
        runningQuestionIndex++;
        questionRender();
    }else{
        clearInterval(TIMER);
        scoreRender();
    }
}

//function that changes color to green when answer is correct
function answerIsCorrect(){
    document.getElementById(runningQuestionIndex).style.backgroundColor = "#0f0"
}

//function that changes color to red when asnwer is incorrect
function answerIsWrong(){
    document.getElementById(runningQuestionIndex).style.backgroundColor = "#f00"
}

//function that renders the score
function scoreRender(){
    scoreDiv.style.display = "block";
    //calculate the percent of questions correctly answered
    let scorePerCent = Math.round(100 * score / questions.length);
    //choose the image based on the scorePerCent
    let img = (scorePerCent >= 80) ? "smile.png" :
              (scorePerCent >= 60) ? "flat.png" :
              (scorePerCent < 60) ? "frown.png" :
              "smile.png";
    scoreDiv.innerHTML = "<img src=" + img +">";
    scoreDiv.innerHTML = "<p>"+ scorePerCent +"%</p>";
}
