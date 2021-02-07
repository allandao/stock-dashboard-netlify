
var currentTimeEST;
var currentDay;

$(document).ready(function () {
    // Time functions -----
    // Get current time in EST and indicate if currently trading hours
    // getJSON is an asynchronous request, need to call a different function to process the fetched data. 
    // Ensure use of API with secure domain (https) to avoid active mixed content issue
    setTimeout(() => {
        $.getJSON('https://worldtimeapi.org/api/timezone/America/New_York', function(time) {
            currentTimeEST = time.datetime;
            currentDay = time.day_of_week;
            checkTime();
        });
    }, 500);

    // Initialize and populate dashboard -----
    var stockTickerArray = [];
    $('body').attr("spellcheck", false); // Disable spell check on tickers for webpage
    populateTable();
    populateTableData();

    // Since the create row functions (appendRow, prependRow) all clone another row, this creates issues when there are no tickers saved,
    // for example. In addition, since there is a default row used for cloning. This then creates the issue it artificially increases the
    // number of stocks present by 1, as it is only removed towards the end after the table is finished initializing.
    var currentChildren = $(".append").children().length;
    if (currentChildren < 9) {
        appendRowNewInitial();
        currentChildren++;
    }
    $(".stockRow:first").remove();
    currentChildren--;
    if (currentChildren == 8) {
        var buttonAdd = document.getElementById("css-irow");
        buttonAdd.disabled = true;
    }

    stockTickerArray.pop(); // Remove last element (since it will be type ticker here/ default element)
    
    // Automatically save cookie after a few seconds, as the dashboard is configured to remove all duplicates.
    setTimeout(() => { saveCookie(); }, 6000);

    // Loading screen -----
    var detachedContent = $('#delayShowContent').remove();
    setTimeout(() => { 
        $('body').append(detachedContent);
    }, 1500); // Edit value to change loading screen length
    // After loading screen, snap back to top of webpage after fade animation finishes
    setTimeout(() => { $('html,body').scrollTop(0); }, 3000);
}); 

// Configure time functions -----
// Process the time fetched from the API
// Output current status based on processed time

function checkTime() {
    
    // Processing strings of current calendar date and time in EST
    var calendarDateWithYear = currentTimeEST.slice(0, 10);
    var calendarDateWithoutYear = currentTimeEST.slice(5, 10);
    var time = currentTimeEST.slice(11, 19);
    var hour = parseInt(time.slice(0, 2));
    var minute = parseInt(time.slice(3, 5));

    // Initialize market holidays
    var marketHolidays = new Set(["01-01", "01-20", "02-17", "04-10", "05-10", "05-25", "07-04", "09-07", "11-26", "12-25"]); 

    // Only applies to physical stock trading (physical trading sclosed on weekends). Stocks are tradable online every day of the week.
    /*if (currentDay == 6 || currentDay == 7) {
        console.log("Not currently a trading day.");
    }*/

    var holiday = false;
    var marketHours = true;

    if (marketHolidays.has(calendarDateWithoutYear)) {
        var timeNotification = document.getElementById("timeNotification");
        timeNotification.innerText = "Not currently a trading day.";
        holiday = true;
    }
    if (hour >= 16 || hour < 9 || (hour == 9 && minute < 30)) {
        var timeNotification = document.getElementById("timeNotification");
        timeNotification.innerText = timeNotification.innerText + "Not currently regular trading hours.";
        marketHours = false;
    }
    if (marketHours && !holiday) {
        var timeNotification = document.getElementById("timeNotification");
        timeNotification.innerText = "Market currently open";
    }
}   

// Configure table functions -----
// Row editing functions
// Cookie functions
// Functions to fetch data from Finnhub API and populate data table

// th - Ticker Symbol
// td (index 0) - Current Price
// td (index 1) - Company Name
// td (index 2) - More information (link to external website)
// td (index 3) - delete row

// Add a new row at the bottom of the table based on a stockTicker string parameter (will populate row header)
function appendRow(stockTicker) { 
    $(".stockRow:last").clone().appendTo('.append');
    var $th = $(".stockRow:last").find('th');
    $($th).text(stockTicker);
}

// Add a new default/blank row at the bottom of the table, where the header is "Type Ticker Here"
function appendRowNew() {
    // Only allows up to 8 stocks on dashboard (cap on the amount of stocks)
    // Needed due to limit on number of requests (limit of requests rate)
    var currentChildren = $(".append").children().length;
    if (currentChildren < 8) {
        // Initialize new row
        $(".stockRow:last").clone().appendTo('.append');
        var $th = $(".stockRow:last").find('th');
        $($th).text("Type Ticker Here");
        var $tds = $(".stockRow:last").find('td');
        $($tds).eq(0).text("$0.00");
        $($tds).eq(1).text("");
        $($tds.eq(2)).children().attr('href', '#');
        $($tds.eq(2)).children().attr('target', '_self');
        currentChildren++;
    } 

    if (currentChildren == 8) {
        var buttonAdd = document.getElementById("css-irow");
        buttonAdd.disabled = true;
    }
}

function appendRowNewInitial() {
    // Initialize new row
    $(".stockRow:last").clone().appendTo('.append');
    var $th = $(".stockRow:last").find('th');
    $($th).text("Type Ticker Here");
    var $tds = $(".stockRow:last").find('td');
    $($tds).eq(0).text("$0.00");
    $($tds).eq(1).text("");
    $($tds.eq(2)).children().attr('href', '#');
    $($tds.eq(2)).children().attr('target', '_self');
}

// Add a new row at the top of the table based on a stockTicker string parameter
function prependRow(stockTicker) { 
    $(".stockRow:last").clone().prependTo('.append');
    var $th = $(".stockRow:first").find('th');
    $($th).text(stockTicker);
}

// Add a new default/blank row at the top of the table, where the header is "Type Ticker Here"
function prependRowNew() { 
    $(".stockRow:last").clone().prependTo('.append');
    var $th = $(".stockRow:first").find('th');
    $($th).text("Type Ticker Here");
    var $tds = $(".stockRow:first").find('td');
    $($tds).eq(0).text("$0.00");
    $($tds).eq(1).text("");
    $($tds.eq(2)).children().attr('href', '#');
    $($tds.eq(2)).children().attr('target', '_self');
}

function removeRow(element) { 
    // Calls parent() twice as element is a link nested in a td and tr elements
    $(element).parent().parent().remove(); 

    // Disable button as when reaching max number of stocks allowed
    // See appendRowNew() for max number of stocks allowed
    var buttonAdd = document.getElementById("css-irow");
    buttonAdd.disabled = false;
}

// Clear all data and reset to one row
function resetRows() { 
    prependRowNew(); // Prepend empty row
    $(".append").find("tr:gt(0)").remove(); // Remove all rows except for newly added row
    var buttonAdd = document.getElementById("css-irow");
    buttonAdd.disabled = false;
}

// Remove saved cookie
function removeCookie() {
    $.removeCookie("stockTickers");
}

// Save cookie by saving all tickers currently on dashboard. Does not check if it is a real ticker.
// Checking to see if a ticker is a real stock is completed when stock dashboard is populating.

function saveCookie() {
    var stockTickerArray = [];
    var stocksTable = $("#stocks table tbody");
    stocksTable.find('tr').each(function (i) {

        var $ths = $(this).find('th'),
        stockTicker = $ths.eq(0).text().toUpperCase();
        
        // Add only if not an empty string and if valid ticker length
        if (stockTicker && stockTicker.length < 5) {
            stockTickerArray.push(stockTicker);
        }
    });

    $.cookie('stockTickers', JSON.stringify(stockTickerArray), {
       expires: 365,       // Expires in 1 year

       secure: true        // If set to true, the secure attribute of the cookie
                            // will be set and the cookie transmission will
                            // require a secure protocol (defaults to false).
    });
}

// Used to clear text "Type Ticker Here" (delete placeholder when clicked)
function clearText(element) {
    if (element.innerText.length > 4) {
        element.innerText = '';
    }
}

// Triggers when the user pastes in a ticker
function trimText(element) {
    element.innerText = element.innerText.substring(0, 4);
}

// Restore ticker text if user does not type anything
function restoreTickerText(element) {
    setTimeout(() => {  
        if (element.innerText.length === 0) {
            element.innerText = 'Type Ticker Here';
        }
    }, 4000);
}

// Function to initialize table when page loads
function populateTable() {
    if (document.cookie.indexOf("stockTickers") != -1) { // will return -1 if cookie does not exist
        window.stockTickerArray = JSON.parse($.cookie('stockTickers')); // Parse saved cookie (stocks saved as array)
        // Append stocks from saved cookie
        var stockTickerSet = new Set(stockTickerArray); 
        for (var ticker of stockTickerSet) {
            window.appendRow(ticker);
        }
    }
}

// Function to populate data in table after initializing
function populateTableData() {
    var stocksTable = $("#stocks table tbody");
        
    stocksTable.find('tr').each(function (i) {
        // Fetch row header, which contains stock ticker
        var $ths = $(this).find('th'),
        stockTicker = $ths.eq(0).text().toUpperCase();

        // Fetch row values 
        var $tds = $(this).find('td');

        if (stockTicker.length < 5) {
            // Fetch and update stock prices
            $.post("https://stockup.netlify.app/.netlify/functions/finnhub-get-price", JSON.stringify({"stock_name":stockTicker}), function(content) {
                var stockData = JSON.parse(content); // Need to parse JSON before accesssing, need to encode JS variables as JSON in order to send as JSON
                if (stockData.data.c > 0) {
                    $tds.eq(0).text("$" + stockData.data.c.toFixed(2));
                } else {
                    $ths.parent().remove();
                }
            });

            // Fetch and update company name column
            $.post("https://stockup.netlify.app/.netlify/functions/finnhub-get-profile", JSON.stringify({"stock_name":stockTicker}), function(content) {
                var stockData = JSON.parse(content); // Need to parse JSON retrieved from Netlify function
                if (stockData.data.name === undefined) {
                    $tds.eq(1).text(stockTicker);
                    if (stockTicker === "Type Ticker Here") {
                        $tds.eq(1).text(""); // Leave empty for default row
                    }
                }
                else {
                    $tds.eq(1).text(stockData.data.name); // Provide company name if available
                }
            });

            $($tds.eq(2)).children().attr('href', 'https://www.marketwatch.com/investing/stock/' + stockTicker);
            $($tds.eq(2)).children().attr('target', '_blank');
        }
    });

    // Automatically refresh and fetch price data every minute - 1 second = 1000 ms
    setTimeout(() => { populateTablePrice(); }, 60000);
}

// Function to automatically refresh table. Will only fetch prices. Number of automatic refreshes is limited to prevent extended use (consideration of API limits)
var totalAutomaticRefreshes = 0;

function populateTablePrice() {
    var stocksTable = $("#stocks table tbody");
        
    stocksTable.find('tr').each(function (i) {
        var $ths = $(this).find('th'),
        stockTicker = $ths.eq(1).text().toUpperCase();

        // Do something with stockTicker
        var $tds = $(this).find('td');

        if (stockTicker.length < 5) {

            // Update stock prices
            $.post("https://stockup.netlify.app/.netlify/functions/finnhub-get-price", JSON.stringify({"stock_name":stockTicker}), function(content) {
                var stockData = JSON.parse(content); // Need to parse JSON from Netlify function GET request
                if (stockData.data.c > 0) {
                    $tds.eq(1).text("$" + data.c.toFixed(2));
                }
            });
        }
    });
    if (totalAutomaticRefreshes < 800) {
        totalAutomaticRefreshes++;
        setTimeout(() => { populateTablePrice(); }, 60000); // Call itself to ensure that this continues
    }
}

// Refresh button, fetches all data points, even for new stocks.
// Key difference: does not include setTimeout portion
function populateTableDataOnce() {
    document.getElementById("refresh-table").disabled = true;
    // Only allow refresh every 10 seconds
    setTimeout(function() { document.getElementById("refresh-table").disabled = false; }, 10000);

    var stocksTable = $("#stocks table tbody");
        
    stocksTable.find('tr').each(function (i) {
        var $ths = $(this).find('th'),
        stockTicker = $ths.eq(0).text().toUpperCase();

        var $tds = $(this).find('td');

        if (stockTicker.length < 5) {

            $($tds.eq(2)).children().attr('href', '#');
            $($tds.eq(2)).children().attr('target', '_self');

            // Update stock prices
            $.post("https://stockup.netlify.app/.netlify/functions/finnhub-get-price", JSON.stringify({"stock_name":stockTicker}), function(content) {
                var stockData = JSON.parse(content); // Need to parse JSON from Netlify function GET request
                if (stockData.data.c > 0) {
                    $tds.eq(0).text("$" + stockData.data.c.toFixed(2));
                    $($tds.eq(2)).children().attr('href', 'https://www.marketwatch.com/investing/stock/' + stockTicker);
                    $($tds.eq(2)).children().attr('target', '_blank');
                } else {
                    $tds.eq(1).text("Invalid ticker.");
                }
            });

            // Update company name column
            $.post("https://stockup.netlify.app/.netlify/functions/finnhub-get-profile", JSON.stringify({"stock_name":stockTicker}), function(content) {
                var stockData = JSON.parse(content); // Need to parse JSON retrieved from Netlify function
                if (stockData.data.name === undefined) {
                    $tds.eq(1).text(stockTicker);
                    if (stockTicker === "Type Ticker Here") {
                        $tds.eq(1).text(""); // Leave empty for default row
                    }
                }
                else {
                    $tds.eq(1).text(stockData.data.name); // Provide company name if available
                }
            });
        }
    });
}

