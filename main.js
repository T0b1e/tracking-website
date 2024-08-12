let savedLocation = { lat: null, long: null };
let canNavigate = false;  // This flag will be used to control when the "Navigate" button can be clicked
let deviceHeading = 0; // Initialize the device's heading to 0

// Throttling: Only update every 1 second
let lastUpdateTime = 0;
const updateInterval = 1000; // 1 second

document.getElementById('location-button').addEventListener('click', function() {
    const button = this;

    if (button.innerText === "Save Location") {
        checkGeolocationPermission(_onGetCurrentLocation);
    } else if (button.innerText === "Navigate" && canNavigate) {
        // Hide the button and show the arrow
        button.style.display = "none";
        document.getElementById('arrow-container').style.display = "block";

        // Start real-time navigation
        navigator.geolocation.watchPosition(function(position) {
            const currentLat = position.coords.latitude;
            const currentLong = position.coords.longitude;

            const currentTime = Date.now();
            if (currentTime - lastUpdateTime > updateInterval) {
                // Update current location info
                document.getElementById('current-location-info').innerHTML = 
                    `Current Location: <strong>${currentLat.toFixed(6)}, ${currentLong.toFixed(6)}</strong>`;

                const bearing = calculateBearing(currentLat, currentLong, savedLocation.lat, savedLocation.long);
                const adjustedBearing = (bearing - deviceHeading + 360) % 360; // Adjust the bearing by the device's heading
                updateArrow(adjustedBearing);

                lastUpdateTime = currentTime; // Update the last update time
            }
        }, function(error) {
            console.log("Error watching position: " + error.message);
            alert("Failed to update location. Please check your location settings.");
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });

        // Start listening to the device orientation
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
});

function checkGeolocationPermission(callback) {
    if (navigator.permissions && navigator.permissions.query) {
        // Try Permissions API first
        navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
            const permission = result.state;
            if (permission === 'granted' || permission === 'prompt') {
                callback();
            } else {
                alert('Location access denied. Please enable location services.');
            }
        });
    } else if (navigator.geolocation) {
        // Fallback to Geolocation API
        callback();
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function _onGetCurrentLocation() {
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    console.log("Attempting to get current location...");
    navigator.geolocation.getCurrentPosition(function(position) {
        savedLocation.lat = position.coords.latitude;
        savedLocation.long = position.coords.longitude;

        // Update saved location info
        document.getElementById('saved-location-info').innerHTML = 
            `Saved Location: <strong>${savedLocation.lat.toFixed(6)}, ${savedLocation.long.toFixed(6)}</strong>`;

        // Disable the button and update its text
        const button = document.getElementById('location-button');
        button.innerText = "Navigate";
        button.style.backgroundColor = "#007bff";
        button.disabled = true;

        // Enable navigation after 5 seconds
        setTimeout(function() {
            canNavigate = true;
            button.disabled = false;
        }, 5000);
    }, function(error) {
        let errorMessage = "Failed to get location. ";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                errorMessage += "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                errorMessage += "An unknown error occurred.";
                break;
        }
        console.log("Error getting location:", error.message);
        alert(errorMessage + " Please ensure location services are enabled and refresh the page.");
    }, options);
}

function calculateBearing(currentLat, currentLong, targetLat, targetLong) {
    const dLat = degreesToRadians(targetLat - currentLat);
    const dLon = degreesToRadians(targetLong - currentLong);

    const y = Math.sin(dLon) * Math.cos(degreesToRadians(targetLat));
    const x = Math.cos(degreesToRadians(currentLat)) * Math.sin(degreesToRadians(targetLat)) -
              Math.sin(degreesToRadians(currentLat)) * Math.cos(degreesToRadians(targetLat)) * Math.cos(dLon);
    let bearing = Math.atan2(y, x);
    bearing = radiansToDegrees(bearing);
    return (bearing + 360) % 360; // Normalize to 0-360
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

function updateArrow(bearing) {
    const arrowElement = document.getElementById('direction-arrow');
    arrowElement.style.transform = `rotate(${bearing}deg)`;
}

function handleOrientation(event) {
    if (event.absolute) {
        deviceHeading = event.alpha; // Use the alpha value which represents the compass direction
    } else {
        alert("Your device does not support absolute orientation readings.");
    }
}
