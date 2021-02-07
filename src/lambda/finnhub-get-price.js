import querystring from "querystring";
import url from "url";
import fetch from "node-fetch";

exports.handler = async (event) => {
    // Parse the body contents into an object.

    var data = JSON.parse(event.body); // Retrieve JSON via event.body and parse the JSON content. 
    // Need to parse the JSON in order to access the JSON data
    // event.body returns JSON
    var API_ENDPOINT = "https://finnhub.io/api/v1/quote?symbol=" + data.stock_name + "&token=" + process.env.FINNHUB_TOKEN;

    // Get request for Finnhub
    return fetch(API_ENDPOINT, { 
    headers: { "Accept": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true } })
    .then(response => response.json())
    .then(data => ({
      statusCode: 200,
      body: JSON.stringify({
    	data // data:data wraps json string in {data : {JSON fetched from Finnhub}}
  	  })
    }))
    .catch(error => ({ statusCode: 422, body: String(error) }));
};