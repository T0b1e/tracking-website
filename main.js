let savedLocation = { lat: null, long: null };
let canNavigate = false;
let deviceHeading = 0;
let lastUpdateTime = 0;
const updateInterval = 500; // Reduced interval for more frequent updates
const arrivalThreshold = 1.0; // Distance threshold in meters for considering "arrived"

// Set up the geolocation and orientation listeners
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('location-button').addEventListener('click', function() {
        const button = this;

        if (button.innerText === "Save Location") {
            checkGeolocationPermission(_onGetCurrentLocation);
        } else if (button.innerText === "Navigate" && canNavigate) {
            button.style.display = "none";
            document.getElementById('arrow-container').style.display = "block";

            navigator.geolocation.watchPosition(function(position) {
                const currentLat = position.coords.latitude;
                const currentLong = position.coords.longitude;

                const currentTime = Date.now();
                if (currentTime - lastUpdateTime > updateInterval) {
                    document.getElementById('current-location-info').innerHTML = 
                        `Current Location: <strong>${currentLat.toFixed(6)}, ${currentLong.toFixed(6)}</strong>`;

                    const distance = calculateDistance(currentLat, currentLong, savedLocation.lat, savedLocation.long);
                    logToTextarea(`Distance to saved location: ${formatDistance(distance)}`);

                    if (distance <= arrivalThreshold) {
                        alert("You have arrived at the saved location!");
                        document.getElementById('arrow-container').style.display = "none";
                        return; // Stop further processing
                    }

                    const bearing = calculateBearing(currentLat, currentLong, savedLocation.lat, savedLocation.long);
                    const adjustedBearing = (bearing - deviceHeading + 360) % 360;
                    logToTextarea(`Bearing: ${bearing}, Adjusted Bearing: ${adjustedBearing}`);
                    updateArrow(adjustedBearing);

                    lastUpdateTime = currentTime;
                }
            }, function(error) {
                logToTextarea("Error watching position: " + error.message);
                alert("Failed to update location. Please check your location settings.");
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });

            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    });
});

// Edit name label functionality
document.getElementById('edit-icon').addEventListener('click', function() {
    const nameLabel = document.getElementById('name-label');
    const nameInput = document.getElementById('name-input');

    nameInput.value = nameLabel.textContent;
    nameLabel.style.display = 'none';
    nameInput.style.display = 'inline';
    nameInput.focus();
});

document.getElementById('name-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const nameLabel = document.getElementById('name-label');
        const nameInput = document.getElementById('name-input');

        nameLabel.textContent = nameInput.value;
        nameLabel.style.display = 'inline';
        nameInput.style.display = 'none';
    }
});

function checkGeolocationPermission(callback) {
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
            const permission = result.state;
            if (permission === 'granted' || permission === 'prompt') {
                callback();
            } else {
                alert('Location access denied. Please enable location services.');
            }
        });
    } else if (navigator.geolocation) {
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
    logToTextarea("Attempting to get current location...");
    navigator.geolocation.getCurrentPosition(function(position) {
        savedLocation.lat = position.coords.latitude;
        savedLocation.long = position.coords.longitude;

        document.getElementById('saved-location-info').innerHTML = 
            `Saved Location: <strong>${savedLocation.lat.toFixed(6)}, ${savedLocation.long.toFixed(6)}</strong>`;

        const button = document.getElementById('location-button');
        button.innerText = "Navigate";
        button.style.backgroundColor = "#007bff";
        button.disabled = true;

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
        logToTextarea("Error getting location: " + error.message);
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

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

function formatDistance(distance) {
    if (distance < 1) {
        return `${(distance * 100).toFixed(2)} cm`; // Display in centimeters
    } else if (distance < 1000) {
        return `${distance.toFixed(2)} m`; // Display in meters
    } else {
        return `${(distance / 1000).toFixed(2)} km`; // Display in kilometers
    }
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

function updateArrow(bearing) {
    logToTextarea(`Updating arrow: bearing=${bearing}, deviceHeading=${deviceHeading}`);
    const arrowElement = document.getElementById('direction-arrow');
    arrowElement.style.transform = `rotate(${bearing}deg)`;
}

function handleOrientation(event) {
    if (event.absolute) {
        deviceHeading = event.alpha; // Use the alpha value which represents the compass direction
        document.getElementById('compass-heading').textContent = `${deviceHeading.toFixed(0)}°`;
        logToTextarea(`Device orientation: alpha=${event.alpha}, beta=${event.beta}, gamma=${event.gamma}`);
    } else {
        alert("Your device does not support absolute orientation readings.");
        logToTextarea("Device does not support absolute orientation readings.");
    }
}

function logToTextarea(message) {
    const textarea = document.getElementById('log-textarea');
    if (textarea) {
        textarea.value += message + "\n";
        textarea.scrollTop = textarea.scrollHeight; // Auto-scroll to the bottom
    } else {
        console.warn("Log textarea element not found. Log message:", message);
    }
}
