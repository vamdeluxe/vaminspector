const slider = document.querySelector('#slider');

slider.onmouseup = function( e ){
  connection.send( JSON.stringify({
    action: 'mixer',
    mix: parseFloat(e.target.value)
  }));
};

window.WebSocket = window.WebSocket || window.MozWebSocket;
const connection = new WebSocket('ws://localhost:8080');


connection.onopen = function () {
  // connection is opened and ready to use
};

connection.onerror = function (error) {
  // an error occurred when sending/receiving data
};

connection.onmessage = function (message) {
  // try to decode json (I assume that each message
  // from server is json)
  try {
    const json = JSON.parse(message.data);
    console.log(json);
    slider.value = json.mix;
  } catch (e) {
    return;
  }
  // handle incoming message
};