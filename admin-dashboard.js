// Array to store ambulance data
let ambulances = [];
// Hash map for quick lookups
let ambulanceMap = new Map();
// Debounce timer for coordinate lookup
let coordinateTimer = null;
// Map and marker variables
let map;
let marker;

// Add these variables at the top with other global variables
let updateMap;
let updateMarker;
let currentAmbulanceId;

// Initialize data from localStorage
function initializeData() {
    const storedAmbulances = localStorage.getItem('ambulances');
    if (storedAmbulances) {
        ambulances = JSON.parse(storedAmbulances);
        // Initialize hash map
        ambulances.forEach(ambulance => {
            ambulanceMap.set(ambulance.id, ambulance);
        });
    }
}

// Save ambulance data to localStorage
function saveAmbulanceData() {
    localStorage.setItem('ambulances', JSON.stringify(ambulances));
}

// Initialize map
function initMap() {
    try {
        // Default center (you can change this to your preferred location)
        const defaultCenter = [20.5937, 78.9629]; // Center of India
        
        // Create map
        map = L.map('map').setView(defaultCenter, 5);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add click listener to map
        map.on('click', (event) => {
            const lat = event.latlng.lat;
            const lng = event.latlng.lng;
            
            // Update marker position
            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng], {
                    draggable: true
                }).addTo(map);
            }

            // Update form fields
            document.getElementById('latitude').value = lat.toFixed(6);
            document.getElementById('longitude').value = lng.toFixed(6);
            
            // Get address from coordinates
            getAddressFromCoordinates(lat, lng);
        });

        // Add marker drag end listener
        map.on('layeradd', (e) => {
            if (e.layer instanceof L.Marker) {
                e.layer.on('dragend', (event) => {
                    const lat = event.target.getLatLng().lat;
                    const lng = event.target.getLatLng().lng;
                    document.getElementById('latitude').value = lat.toFixed(6);
                    document.getElementById('longitude').value = lng.toFixed(6);
                    getAddressFromCoordinates(lat, lng);
                });
            }
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                <p>Unable to load the map. Please check your internet connection.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Get address from coordinates using Nominatim
function getAddressFromCoordinates(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            if (data.display_name) {
                document.getElementById('currentLocation').value = data.display_name;
            } else {
                document.getElementById('currentLocation').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
        })
        .catch(error => {
            console.error('Error getting address:', error);
            document.getElementById('currentLocation').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        });
}

// Update map when coordinates are set
function updateMapLocation(lat, lng) {
    if (!map) return;
    
    const position = [parseFloat(lat), parseFloat(lng)];
    
    // Update map center
    map.setView(position, 13);
    
    // Update or create marker
    if (marker) {
        marker.setLatLng(position);
    } else {
        marker = L.marker(position, {
            draggable: true
        }).addTo(map);
    }
}

// Get coordinates from address using Nominatim
function getCoordinates(address, isManual = false) {
    // Clear any existing timer
    if (coordinateTimer) {
        clearTimeout(coordinateTimer);
    }

    // If it's not a manual lookup, set a timer
    if (!isManual) {
        coordinateTimer = setTimeout(() => {
            lookupCoordinates(address);
        }, 500); // Wait for 500ms after user stops typing
    } else {
        lookupCoordinates(address);
    }
}

// Helper function to perform the actual coordinate lookup
function lookupCoordinates(address) {
    if (!address || address.trim() === '') {
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        return;
    }

    const button = document.querySelector('.get-coordinates-btn');
    const icon = button.querySelector('i');
    
    // Show loading state
    button.classList.add('loading');
    icon.className = 'fas fa-spinner';

    // Use Nominatim for geocoding
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                
                document.getElementById('latitude').value = lat.toFixed(6);
                document.getElementById('longitude').value = lng.toFixed(6);
                
                // Update map
                updateMapLocation(lat, lng);
            } else {
                document.getElementById('latitude').value = '';
                document.getElementById('longitude').value = '';
                alert('Could not find coordinates for this location. Please try a different location.');
            }
        })
        .catch(error => {
            console.error('Error getting coordinates:', error);
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            alert('Error getting coordinates. Please try again.');
        })
        .finally(() => {
            // Reset button state
            button.classList.remove('loading');
            icon.className = 'fas fa-map-marker-alt';
        });
}

// Get current location using browser's geolocation API
function getCurrentLocation() {
    const button = document.querySelector('.current-location-btn');
    const icon = button.querySelector('i');
    
    // Show loading state
    button.classList.add('loading');
    icon.className = 'fas fa-spinner';
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        button.classList.remove('loading');
        icon.className = 'fas fa-location-arrow';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            // Set coordinates
            document.getElementById('latitude').value = latitude.toFixed(6);
            document.getElementById('longitude').value = longitude.toFixed(6);
            
            // Set location text to coordinates
            document.getElementById('currentLocation').value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            // Update map
            updateMapLocation(latitude, longitude);
            
            // Reset button state
            button.classList.remove('loading');
            icon.className = 'fas fa-location-arrow';
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location. Please check your location settings.');
            
            // Reset button state
            button.classList.remove('loading');
            icon.className = 'fas fa-location-arrow';
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Add new ambulance
function addNewAmbulance(event) {
    event.preventDefault();
    
    const id = document.getElementById('ambulanceId').value;
    const driverName = document.getElementById('driverName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const type = document.getElementById('ambulanceType').value;
    const currentLocation = document.getElementById('currentLocation').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    
    // Check if ambulance ID already exists
    if (ambulanceMap.has(id)) {
        alert('Ambulance ID already exists!');
        return false;
    }
    
    const newAmbulance = {
        id,
        driverName,
        phoneNumber,
        type,
        status: 'Available',
        currentLocation,
        latitude,
        longitude,
        locationHistory: [{
            location: currentLocation,
            latitude,
            longitude,
            timestamp: new Date().toISOString()
        }]
    };
    
    ambulances.push(newAmbulance);
    ambulanceMap.set(id, newAmbulance);
    saveAmbulanceData();
    displayAmbulances();
    
    // Clear form
    document.getElementById('addAmbulanceForm').reset();
    
    alert('Ambulance added successfully!');
    return false;
}

// Update ambulance status
function updateAmbulanceStatus(id) {
    currentAmbulanceId = id;
    const ambulance = ambulanceMap.get(id);
    if (!ambulance) return;
    
    // Show modal
    document.getElementById('statusUpdateModal').style.display = 'block';
    
    // Initialize update map
    initUpdateMap();
    
    // Set current values
    document.getElementById('updateLocation').value = ambulance.currentLocation;
    document.getElementById('updateLatitude').value = ambulance.latitude;
    document.getElementById('updateLongitude').value = ambulance.longitude;
    
    // Update map to show current location
    if (ambulance.latitude && ambulance.longitude) {
        updateMapLocation(ambulance.latitude, ambulance.longitude, true);
    }
}

// Initialize update map
function initUpdateMap() {
    if (updateMap) {
        updateMap.remove();
    }
    
    const defaultCenter = [20.5937, 78.9629];
    updateMap = L.map('updateMap').setView(defaultCenter, 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(updateMap);
    
    updateMap.on('click', (event) => {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        
        if (updateMarker) {
            updateMarker.setLatLng([lat, lng]);
        } else {
            updateMarker = L.marker([lat, lng], {
                draggable: true
            }).addTo(updateMap);
        }
        
        document.getElementById('updateLatitude').value = lat.toFixed(6);
        document.getElementById('updateLongitude').value = lng.toFixed(6);
        getUpdateAddressFromCoordinates(lat, lng);
    });
}

// Get update coordinates
function getUpdateCoordinates(address, isManual = false) {
    if (coordinateTimer) {
        clearTimeout(coordinateTimer);
    }
    
    if (!isManual) {
        coordinateTimer = setTimeout(() => {
            lookupUpdateCoordinates(address);
        }, 500);
    } else {
        lookupUpdateCoordinates(address);
    }
}

// Lookup update coordinates
function lookupUpdateCoordinates(address) {
    if (!address || address.trim() === '') {
        document.getElementById('updateLatitude').value = '';
        document.getElementById('updateLongitude').value = '';
        return;
    }
    
    const button = document.querySelector('#statusUpdateModal .get-coordinates-btn');
    const icon = button.querySelector('i');
    
    button.classList.add('loading');
    icon.className = 'fas fa-spinner';
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                
                document.getElementById('updateLatitude').value = lat.toFixed(6);
                document.getElementById('updateLongitude').value = lng.toFixed(6);
                updateMapLocation(lat, lng, true);
            } else {
                document.getElementById('updateLatitude').value = '';
                document.getElementById('updateLongitude').value = '';
                alert('Could not find coordinates for this location. Please try a different location.');
            }
        })
        .catch(error => {
            console.error('Error getting coordinates:', error);
            document.getElementById('updateLatitude').value = '';
            document.getElementById('updateLongitude').value = '';
            alert('Error getting coordinates. Please try again.');
        })
        .finally(() => {
            button.classList.remove('loading');
            icon.className = 'fas fa-map-marker-alt';
        });
}

// Get update current location
function getUpdateCurrentLocation() {
    const button = document.querySelector('#statusUpdateModal .current-location-btn');
    const icon = button.querySelector('i');
    
    button.classList.add('loading');
    icon.className = 'fas fa-spinner';
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        button.classList.remove('loading');
        icon.className = 'fas fa-location-arrow';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            document.getElementById('updateLatitude').value = latitude.toFixed(6);
            document.getElementById('updateLongitude').value = longitude.toFixed(6);
            document.getElementById('updateLocation').value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            updateMapLocation(latitude, longitude, true);
            
            button.classList.remove('loading');
            icon.className = 'fas fa-location-arrow';
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location. Please check your location settings.');
            
            button.classList.remove('loading');
            icon.className = 'fas fa-location-arrow';
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Get update address from coordinates
function getUpdateAddressFromCoordinates(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            if (data.display_name) {
                document.getElementById('updateLocation').value = data.display_name;
            } else {
                document.getElementById('updateLocation').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
        })
        .catch(error => {
            console.error('Error getting address:', error);
            document.getElementById('updateLocation').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        });
}

// Update map location for status update
function updateMapLocation(lat, lng, isUpdate = false) {
    const mapToUse = isUpdate ? updateMap : map;
    const markerToUse = isUpdate ? updateMarker : marker;
    
    if (!mapToUse) return;
    
    const position = [parseFloat(lat), parseFloat(lng)];
    mapToUse.setView(position, 13);
    
    if (markerToUse) {
        markerToUse.setLatLng(position);
    } else {
        const newMarker = L.marker(position, {
            draggable: true
        }).addTo(mapToUse);
        
        if (isUpdate) {
            updateMarker = newMarker;
        } else {
            marker = newMarker;
        }
    }
}

// Confirm status update
function confirmStatusUpdate() {
    const ambulance = ambulanceMap.get(currentAmbulanceId);
    if (!ambulance) return;
    
    const newStatus = ambulance.status === 'Available' ? 'Busy' : 'Available';
    const newLocation = document.getElementById('updateLocation').value;
    const latitude = document.getElementById('updateLatitude').value;
    const longitude = document.getElementById('updateLongitude').value;
    
    if (!newLocation || !latitude || !longitude) {
        alert('Please select a location first');
        return;
    }
    
    // Update ambulance data
    ambulance.status = newStatus;
    ambulance.currentLocation = newLocation;
    ambulance.latitude = latitude;
    ambulance.longitude = longitude;
    
    // Add to location history
    ambulance.locationHistory.push({
        location: newLocation,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
    });
    
    saveAmbulanceData();
    displayAmbulances();
    closeStatusModal();
}

// Close status modal
function closeStatusModal() {
    document.getElementById('statusUpdateModal').style.display = 'none';
    if (updateMap) {
        updateMap.remove();
        updateMap = null;
    }
    updateMarker = null;
    currentAmbulanceId = null;
}

// Add event listener for modal close button
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = closeStatusModal;
    }
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        const modal = document.getElementById('statusUpdateModal');
        if (event.target === modal) {
            closeStatusModal();
        }
    };
});

// Display ambulances
function displayAmbulances() {
    const ambulanceList = document.getElementById('ambulanceList');
    ambulanceList.innerHTML = '';
    
    ambulances.forEach(ambulance => {
        const ambulanceCard = document.createElement('div');
        ambulanceCard.className = 'ambulance-item';
        ambulanceCard.innerHTML = `
            <h4>Ambulance ${ambulance.id}</h4>
            <p>Driver: ${ambulance.driverName}</p>
            <p>Phone: ${ambulance.phoneNumber}</p>
            <p>Type: ${ambulance.type}</p>
            <p>Status: <span class="status-${ambulance.status.toLowerCase()}">${ambulance.status}</span></p>
            <div class="location-info">
                <p>Location: ${ambulance.currentLocation}</p>
                <p class="coordinates">Coordinates: ${ambulance.latitude}, ${ambulance.longitude}</p>
                ${ambulance.status === 'Busy' && ambulance.userMobile ? `<p><strong>User Mobile:</strong> ${ambulance.userMobile}</p>` : ''}
                ${ambulance.status === 'Busy' && ambulance.userAddress ? `<p><strong>User Location:</strong> ${ambulance.userAddress}</p>` : ''}
            </div>
            <button onclick="updateAmbulanceStatus('${ambulance.id}')" 
                    class="status-btn ${ambulance.status.toLowerCase()}">
                Mark as ${ambulance.status === 'Available' ? 'Busy' : 'Available'}
            </button>
            <button onclick="showLocationHistory('${ambulance.id}')" class="history-btn">
                View Location History
            </button>
        `;
        ambulanceList.appendChild(ambulanceCard);
    });
}

// Show location history
function showLocationHistory(id) {
    const ambulance = ambulanceMap.get(id);
    if (!ambulance) return;
    
    let historyText = 'Location History:\n\n';
    ambulance.locationHistory.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleString();
        historyText += `${date}\n`;
        historyText += `Location: ${entry.location}\n`;
        historyText += `Coordinates: ${entry.latitude}, ${entry.longitude}\n\n`;
    });
    
    alert(historyText);
}

// Check authentication
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href ='admin-login.html' ;
        return;
    }
    document.getElementById('adminName').textContent = currentUser.username;
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'admin-dashboard.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeData();
    displayAmbulances();
    initMap();
});

// Add a function to handle map loading errors
function handleMapError() {
    document.getElementById('map').innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
            <p>Unable to load the map. Please check your internet connection.</p>
        </div>
    `;
}

function updateLocationFromInput() {
    const address = document.getElementById('updateLocation').value;
    if (!address || address.trim() === '') {
        alert('Please enter a location.');
        return;
    }
    // Use the same lookup as getUpdateCoordinates, but always manual
    getUpdateCoordinates(address, true);

    // Immediately update the ambulance's location, coordinates, and status in the data and UI
    setTimeout(() => {
        const ambulance = ambulanceMap.get(currentAmbulanceId);
        if (!ambulance) return;
        const latitude = document.getElementById('updateLatitude').value;
        const longitude = document.getElementById('updateLongitude').value;
        if (latitude && longitude) {
            ambulance.currentLocation = address;
            ambulance.latitude = latitude;
            ambulance.longitude = longitude;
            // Toggle status
            ambulance.status = ambulance.status === 'Available' ? 'Busy' : 'Available';
            // Add to location history
            ambulance.locationHistory.push({
                location: address,
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            });
            saveAmbulanceData();
            displayAmbulances();
            closeStatusModal();
        }
    }, 700); // Wait for coordinates to update
} 