async function get_token() {
    const url = 'https://api.joinprogram.com/oauth/token';
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.5',
        'connection': 'keep-alive',
        'content-type': 'application/json',
        'host': 'api.joinprogram.com',
        'origin': 'https://menu.joinprogram.com',
        'referer': 'https://menu.joinprogram.com/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0',
    };
    const request_data = {
        'client_id': '3',
        'client_secret': '2o3sF2uoTdp2fDDV1ol3jSV54fmngtZKNBrRf8Tg',
        'grant_type': 'client_credentials',
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(request_data),
    });

    return await response.json().then((data) => data['access_token']);
}

async function get_menu(date, token) {
    const url = 'https://api.joinprogram.com/graphql?operationName=dailyMenu&requestId=1';
    const headers = {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.5',
        'authorization': `Bearer ${token}`,
        'connection': 'keep-alive',
        'content-type': 'application/json',
        'host': 'api.joinprogram.com',
        'origin': 'https://menu.joinprogram.com',
        'referer': 'https://menu.joinprogram.com/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0',
    };
    const request_data = {
        'operationName': 'dailyMenu',
        'query': 'query dailyMenu($clientID: ID!, $date: Date!, $filters: DailyMenuFilters) {\n  dailyMenu(clientID: $clientID, date: $date, filters: $filters) {\n    date\n    restaurants {\n      items {\n        ...DailyMenuItem\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment DailyMenuItem on DailyMenuItem {\n  name\n  tagline\n  description\n  price\n  tags {\n    name\n    __typename\n  }\n  sources {\n    ...DailyMenuItemSourceIDs\n    __typename\n  }\n  context {\n    restaurantID\n    __typename\n  }\n  category: publicCategory {\n    id\n    name\n    __typename\n  }\n  allergens {\n    ...Allergen\n    __typename\n  }\n  nutrients {\n    ...Nutrient\n    __typename\n  }\n  additions {\n    ...Addition\n    __typename\n  }\n  images {\n    ...DailyMenuItemImages\n    __typename\n  }\n  stock {\n    ...ApiStockNumbers\n    __typename\n  }\n  __typename\n}\n\nfragment DailyMenuItemSourceIDs on DailyMenuItemSourceIDs {\n  menuEntry\n  menuEntryOccurrence\n  product\n  productVersion\n  __typename\n}\n\nfragment Allergen on Allergen {\n  id\n  name\n  icon\n  __typename\n}\n\nfragment Nutrient on Nutrient {\n  __typename\n  NutrientType {\n    __typename\n    id\n    name\n    unit\n  }\n  perHundredGram\n}\n\nfragment Addition on Addition {\n  id\n  name\n  price\n  __typename\n}\n\nfragment DailyMenuItemImages on DailyMenuItemImages {\n  original\n  square150\n  square300\n  square600\n  __typename\n}\n\nfragment ApiStockNumbers on StockNumbers {\n  amountTotalInitial\n  amountTotalCorrection\n  amountTotal\n  amountClaimed\n  amountIssued\n  amountReserved\n  amountAvailable\n  amountIssuable\n  isConstrained\n  isExhausted\n  isCorrected\n  __typename\n}',
        'variables': {
            'clientID': '11',
            'date': date,
            'filters': {
                'productTypes': ['MEAL'],
                'restaurants': ['17', '18', '19', '78'],
            }
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(request_data),
    });

    const menu = await response.json();
    const items = [];
    for (const restaurant of menu.data.dailyMenu.restaurants) {
        for (const item of restaurant.items) {
            if (item.description?.includes('Breakfast will be served')) continue;
            if (item.description?.includes('Start your day the NYC way')) continue;
            items.push({
                name: item.name,
                description: item.description,
                image: item.images.original,
            });
        }

    }

    return items;
}

function dateToStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDateForDay(i) {
    // how many days do we have to offset until Monday?
    // if it's Sunday or Saturday, we want next Monday
    // Sunday is day 0 in JS
    const dateOffsets = [1, 0, -1, -2, -3, -4, 2];
    const date = new Date();
    const currentDay = date.getDay();
    date.setDate(date.getDate() + dateOffsets[currentDay] + i);
    return date;
}

const token = await get_token();
const promises = [];
for (let i = 0; i < 5; i++) {
    const date = getDateForDay(i);
    promises.push(get_menu(dateToStr(date), token));
}

const menus = await Promise.all(promises);
const menu_per_day = menus.reduce((obj, element, i) => {
    const key = dateToStr(getDateForDay(i));
    obj[key] = element;
    return obj;
}, {});

console.log(`// updated on ${new Date().toISOString()}\nconst menu_per_day = ${JSON.stringify(menu_per_day, null, 2)};`)
