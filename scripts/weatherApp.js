/*
IMPLEMENTATION NOTES

    The WeatherApp is initialized to have lots of null values, that
    will later scrape the openweathermap.org weather API to fill in these values.

    Inside the event listeners section at the bottom I wait for the user to enter a city,
    it then calls the instance of the WeatherApp which will async and await fetch of all the information
    through multiple functions which all accomplish the same goal: filling the null values.

    Once it makes it to the last helper function, it calls inst.updateWebPage()
    which then takes all the values from WeatherApp record and adds the elements to the screen
*/

class WeatherApp
{
    constructor ()
    {
        this._key = "5e482f7159b9e47be7178cdff1c5b019";
        this._SEARCH_LIMIT = 1;
        this._lat = null;
        this._long = null;
        this._cityName = null;
        this._temp = null;
        this._highTemp = null;
        this._lowTemp = null;
        this._weatherType = null;
        this._Days = null;
        this._humidity = null;
        this._pressure = null;
        this._wind_speed = null;
        this._prevDays = null;
    }

    /* Async Functions used to fetch from the online API  (SETS LATITUDE AND LONGITUDE)*/
    async getCityLatLon(city_name) {
        await fetch('https://api.openweathermap.org/geo/1.0/direct?q=' + city_name + '&limit=' + this._SEARCH_LIMIT + "&appid=" + this._key)
            .then(function(resp) { return resp.json() })
            .then(function(data) {
                inst.setLatLong(data[0].lat, data[0].lon);
            })
            .catch(function() {
                console.log("Failed to get longitute and latitute.\n Try retyping a new city.")
        });
    }

    /* Gets the current weather temps and type and uses the helper setter function setCurr to set them */
    async getCurrentWeatherData()
    {
        await fetch('https://api.openweathermap.org/data/2.5/weather?lat='+ this._lat + '&lon='+ this._long + '&appid=' + this._key)
            .then(function(resp){ return resp.json() })
                .then(function(data) {
                    /* Gets the low current and high temp of the city and weather*/
                    let temp_curr_f = 1.8 * (data.main.feels_like - 273) + 32;
                    let temp_max_f = 1.8 * (data.main.temp_max - 273) + 32;
                    let temp_min_f = 1.8 * (data.main.temp_min - 273) + 32;
                    let weather = data.weather[0].main;
                    inst.setCurr(temp_curr_f, temp_max_f, temp_min_f, weather, data.name);
                })
                .catch(function(){
                    console.log("Failed getting the current weather data.\n");
                })
    }

    /*
     Gathers the next 4 days of weather forcast and stores the day, temp (f), and weather
     inside a record to set this._Days equal to the list of records 
    */
    async getForcast()
    {
        await fetch('https://api.openweathermap.org/data/2.5/onecall?lat=' + this._lat + '&lon=' + this._long + '&appid=' + this._key)
            .then(function(resp){ return resp.json()})
                .then(function(data){
                    let forcast = data.daily;
                    let today = forcast[0];
                    let lst = [];
                    for (let i = 0;  i < 4;  i++)
                    {
                        let day = forcast[i];
                        let temp = 1.8 * (day.temp.day - 273) + 32;
                        let weather = day.weather[0].main;
                        let record = { 'day' : i, 'temp': temp, 'weather' : weather};
                        lst.push(record);
                        inst.setForcast(lst);
                    }
                    inst.setAdvanced(today.humidity, today.pressure, today.wind_speed);
                    inst.updateWebPage();
                })
                .catch(function(){
                    console.log("Failed getting the forcast.\n");
                })
    }

    /* Uses the built in Date library to get the last 4 days of data from the API */
    async getPreviousForcast()
    {
        var oneDay = new Date(new Date().setDate(new Date().getDate() - 1));
        var twoDay = new Date(new Date().setDate(new Date().getDate() - 2));
        var threeDay = new Date(new Date().setDate(new Date().getDate() - 3));
        var fourDay = new Date(new Date().setDate(new Date().getDate() - 4));

        const ts1 = oneDay.getTime();
        const ts2 = twoDay.getTime();
        const ts3 = threeDay.getTime();
        const ts4 = fourDay.getTime();

        const unixOne = Math.floor(oneDay.getTime() / 1000);
        const unixTwo = Math.floor(twoDay.getTime() / 1000);
        const unixThree = Math.floor(threeDay.getTime() / 1000);
        const unixFour = Math.floor(fourDay.getTime() / 1000);
        const unix_list = [unixOne, unixTwo, unixThree, unixFour];
        let lst = [];
        for (let i = 0; i < unix_list.length; i++)
        {
            await fetch('https://api.openweathermap.org/data/2.5/onecall/timemachine?lat='+ this._lat +'&lon='+ this._long + '&dt='+ unix_list[i] +'&appid=' + this._key)
            .then(function(resp){ return resp.json()})
                    .then(function(data){
                        let temp = 1.8 * (data.current.temp - 273) + 32;
                        let weather = data.current.weather[0].main;
                        let day = i;
                        let record = {day, temp, weather};
                        lst.push(record);
                    })
                    .catch(function(){
                        console.log("Failed getting previous forcast. \n");
                    })
        }
        this.setPrevDays(lst);

    }

    /* Setters */
    setPrevDays(lst)
    {
        this._prevDays = lst;
    }

    setAdvanced(humidity, pressure, wind_speed)
    {
        this._humidity = humidity;
        this._pressure = pressure;
        this._wind_speed = wind_speed;
        this.getPreviousForcast();
    }

    setLatLong(lat, long)
    {
        this._lat = lat;
        this._long = long;
        this.getCurrentWeatherData();
    }

    setCurr(curr, max, min, weather, city)
    {
        unit_button.data = 'off';
        this._temp = FtoC(this._temp);
        this._temp = curr.toFixed(2);
        this._highTemp = max.toFixed(2);
        this._lowTemp = min.toFixed(2);
        this._weatherType = weather;
        this._cityName = city;
        current_temp_DOM.data = this._temp;
        this.getForcast();
    }

    setForcast( lst )
    {
        this._Days = lst;
    }

    /* Updates all of the web page DOM elements */
    updateWebPage()
    {
        city_DOM.innerHTML = this._cityName;
        current_temp_DOM.innerHTML = this._temp + '&degF';
        humidity_val.innerHTML = this._humidity + '%';
        pressure_val.innerHTML = this._pressure + ' hPa';
        wind_val.innerHTML = this._wind_speed + ' m/s';


        /*
        Iterates through the list this._Days which holds a reference
        to DOM img tags and sets the innerHTML into the type of weather and
        sets the image into the icon of the type of weather
        */
        for (let i = 0; i < 4; i++)
        {
            circle_temp[i].innerHTML = inst._Days[i].temp.toFixed(2) + '&degF';
            setImage(i, inst._Days[i].weather );
        }


        /* Simply sets the weather icon in the middle of the screen */
        switch(inst._weatherType)
            {
                case 'Rain':
                    curr_img.src = "./Images/rain.png"; break;

                case 'Clouds':
                    curr_img.src = "./Images/clouds.png"; break;

                case 'Clear':
                    curr_img.src = "./Images/sunny.png"; break;

                case 'Snow':
                    curr_img.src = "./Images/snow.png"; break;

                default:
                    return;
            }
        curr_img.style.visibility = 'visible';
    }
}

/* Creates an instance of the WeatherApp */
let inst = new WeatherApp();

/* DOM Objects */
let slider_DOM = document.getElementById("myRange");
let background_DOM = document.getElementById("background_image");
let userInput = document.getElementById("user_input");
let city_DOM = document.getElementById("city_name");
let current_temp_DOM = document.getElementById("current_temp");
let menu_DOM = document.getElementById("menu_bar");
let circles = document.querySelectorAll(".circle");
let circle_temp = document.querySelectorAll(".day_temp");
let day_image = document.querySelectorAll(".day_image");
let unit_button = document.getElementById("unit_button");
let humidity = document.getElementById("humidity");
let humidity_val = document.getElementById("humidity_val");
let pressure = document.getElementById("pressure");
let pressure_val = document.getElementById("pressure_val");
let wind = document.getElementById("wind_speed");
let wind_val = document.getElementById("wind_val");
let curr_img = document.getElementById("curr_img");
let previous_button = document.getElementById("previous_button");
let prev_button = document.getElementById("prev_button");
let advanced_settings = [humidity, pressure, wind];


/* EVENT LISTENERS */

/* Checks the user input to then call the helper functions to start the program */
userInput.addEventListener("keypress", function(e){
    if(e.key.toUpperCase() == "ENTER")
    {
        let city = userInput.value.toString();
        inst.getCityLatLon(city);
    }
})

/*
Creates a grayscale effect. The idea I had was that the background may be too
bright for some users, so it gives you the option to dial it back.
*/
slider_DOM.oninput = function()
{
    let val = slider_DOM.value;
    background_DOM.style.filter = "grayscale(" + val + "%)";
}

/*
Switches the visibility of the moving menu... When you go inside the object
it will make the visibility = 'visible' once the menu width is at its max width.
*/
menu_DOM.addEventListener('transitionend', function()
{
    if (menu_DOM.offsetWidth === 220)
    {
        setCircleState('visible');
    }
})

/*
Switches the visibility of the moving menu... When you go outside of the object
it will make the visibility = 'hidden'
*/
menu_DOM.addEventListener('transitionstart', function(){
    if(menu_DOM.offsetWidth > 200 && menu_DOM.offsetWidth <= 220)
    {
        setCircleState('hidden');
    }
})


/*
    Switches previous settings by setting the color of the button to activated or not
    also iterates the prevDays state that holds a list of records of the previous temps and weather conditions
    and then sets the circles to these values!
*/
previous_button.addEventListener('click', function(){
    let val = previous_button.getAttribute("data");
    if (val === 'off')
    {
        previous_button.setAttribute("data", "on");
        prev_button.style.backgroundColor = "lightgreen";
        prev_button.style.color = 'white';
        for (let i = 0; i < circle_temp.length; i++)
        {
            let temp = inst._prevDays[i].temp.toFixed(2);
            if (unit_button.getAttribute("data") === 'on')
            {
                circle_temp[i].innerHTML = FtoC(temp) + '&degC';
            } else {
                circle_temp[i].innerHTML = temp + '&degF';

            }
            setImage(i, inst._prevDays[i].weather);
        }
    } else {
        previous_button.setAttribute("data", "off");
        prev_button.style.backgroundColor = null;
        prev_button.style.color = 'black';
        for (let i = 0; i < circle_temp.length; i++)
        {
            let temp = inst._Days[i].temp.toFixed(2);
            if (unit_button.getAttribute("data") === 'on')
            {
                circle_temp[i].innerHTML = FtoC(temp) + '&degC';
            } else {
                circle_temp[i].innerHTML = temp + '&degF';

            }

            setImage(i, inst._Days[i].weather);
        }
    }
})


/*
Converts all the temps that exist on the screen to F or to C depending
on the attribute value of unit_button in the DOM
*/
unit_button.addEventListener('click', function(){
    let val = unit_button.getAttribute("data");
    let temp = current_temp_DOM.data;
    if (val === 'off')
    {
        unit_button.setAttribute("data", "on");
        temp = FtoC(temp);
        for(let forcast of circle_temp)
        {
            let t = FtoC(parseInt(forcast.innerHTML));
            forcast.innerHTML = t + '&degC';
        }
        current_temp_DOM.data = temp;
        current_temp_DOM.innerHTML = temp + '&degC';
    } else {
        unit_button.setAttribute("data", "off");
        temp = CtoF(temp);
        for(let forcast of circle_temp)
        {
            let t = CtoF(parseInt(forcast.innerHTML));
            forcast.innerHTML = t + '&degF';
        }
        current_temp_DOM.data = temp;
        current_temp_DOM.innerHTML = temp + '&degF';
    }
})


/* GLOBAL FUNCTIONS */

/* Converts fahrenheit to Celcius */
function FtoC (temp)
{
    return ((temp - 32) * 0.5556).toFixed(2);
}

/* Converts celcius to fahrenheit */
function CtoF(temp)
{
    return ((temp * 1.8) + 32).toFixed(2);
}

/* Switches the visibility of all the advanced settings that are hidden */
function enableAdvanced( iter )
{
    for (val of advanced_settings)
    {
        val.style.visibility = "visible";
    }
}

/* Switches the visibility of all the advanced settings that are visible */
function disableAdvanced()
{
    for (val of advanced_settings)
    {
        val.style.visibility = "hidden";
    }
}

/* Switches the visibility of the circles (called inside the menu_DOM event listeners) */
function setCircleState(state)
{
    for (let i = 0; i < circles.length; i++)
    {
        circles[i].style.visibility = state;
    }
}

function setImage( i, obj )
{
  switch(obj)
  {
      case 'Rain':
          day_image[i].src = "./Images/rain.png"; break;

      case 'Clouds':
          day_image[i].src = "./Images/clouds.png"; break;

      case 'Clear':
          day_image[i].src = "./Images/sunny.png"; break;

      case 'Snow':
          day_image[i].src = "./Images/snow.png"; break;

      default:
          return;
  }
}
