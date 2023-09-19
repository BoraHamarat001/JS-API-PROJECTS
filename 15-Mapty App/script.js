'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Storing the all project architecture data by OOP
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  description;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  incClick() {
    this.clicks++;
  }
  _setDescription() {
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
    return this;
  }
  calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
    return this;
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;

  workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this)); //create new workout and display it in both map and list
    inputType.addEventListener('change', this._toggleElevationField);
    document
      .querySelector('.workouts')
      .addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }
  _renderWorkoutMarker(work) {
    L.marker(work.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${work.type}-popup`,
        })
      )
      .setPopupContent(
        `${work.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${work.description} `
      )
      .openPopup();
  }
  _loadMap(position) {
    //map and setting current location
    const coords = [position.coords.latitude, position.coords.longitude];
    this.#map = L.map('map').setView(coords, 13); // initialize the map on the "map" div with a given center and zoom

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //style of the map Ex:.org/ .fr/hot/
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    //rendering all workout markers
    this.workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }
  _showForm(mapE) {
    //get clicked location and set it to mapEvent
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
  }
  //cadence or elevation depends on the type of workout(when running is selected, show cadence, else show elevation)
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //create workout elements and display in the container
  _displayWorkoutsList(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
  `;

    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;
    document
      .querySelector('.container--workouts')
      .insertAdjacentHTML('afterbegin', html);
  }

  _newWorkout(e) {
    e.preventDefault();
    /*let validWorkout =
      inputDuration.value > 0 &&
      inputDistance.value > 0 &&
      (inputCadence.value > 0 || inputElevation.value > 0);
*/
    const allNumber = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);
    let workoutObject;

    const clickedLocation = [
      this.#mapEvent.latlng.lat,
      this.#mapEvent.latlng.lng,
    ];

    if (inputType.value == 'cycling') {
      if (
        !allNumber(
          +inputDuration.value,
          +inputDistance.value,
          +inputElevation.value
        ) ||
        !allPositive(
          +inputDuration.value,
          +inputDistance.value,
          +inputElevation.value
        )
      )
        return alert('Workout information is not valid!');
      workoutObject = new Cycling(
        clickedLocation,
        inputDistance.value,
        inputDuration.value,
        inputElevation.value
      );
    }
    if (inputType.value == 'running') {
      if (
        !allNumber(
          +inputDistance.value,
          +inputDuration.value,
          +inputCadence.value
        ) ||
        !allPositive(
          +inputDistance.value,
          +inputDuration.value,
          +inputCadence.value
        )
      )
        return alert('Workout information is not valid!');
      workoutObject = new Running(
        clickedLocation,
        inputDistance.value,
        inputDuration.value,
        inputCadence.value
      );
    }
    /*const workoutObject=inputType.value == 'running'
        ? new Running(
            clickedLocation,
            inputDistance.value,
            inputDuration.value,
            inputCadence.value
          )
        : new Cycling(
            clickedLocation,
            inputDistance.value,
            inputDuration.value,
            inputElevation.value
          );*/

    this.workouts.push(workoutObject); //add workout object to workouts array
    this._setLocalStorage();
    this._renderWorkoutMarker(workoutObject);
    this._displayWorkoutsList(workoutObject);
    this.form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
    document.querySelector('.container--workouts').innerHTML = '';
    this.workouts.forEach(function (workout, _) {
      //display all workout array in the list
      console.log(workout);
      this._displayWorkoutsList(workout);
      this._renderWorkoutMarker(workout);
    });
    this._hideForm();
  }
  _hideForm() {
    inputCadence.value =
      inputDuration.value =
      inputDistance.value =
      inputElevation.value =
        '';
    inputDistance.focus();
  }
  _moveToPopup(e) {
    //when clicked any workout element in the list, show its marker on the map.
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const targetWorkout = this.workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    this.#map.setView(targetWorkout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
    targetWorkout.incClick();
    this._setLocalStorage();
  }

  _setLocalStorage() {
    //add all workout data to an localStorage object to keep it even after reloaded the page.
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.workouts = data;
    this.workouts.forEach(workout => {
      this._displayWorkoutsList(workout);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app1 = new App();
