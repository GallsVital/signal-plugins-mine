declare type HueBridgeInfo = {
    name: string,
    datastoreversion: string
    swversion: string,
    apiversion: string,
    mac: string,
    bridgeid: string,
    factorynew: boolean,
    repalcesbridgeid: boolean,
    modelid: string
    starterkitid: string,
}


declare type HueLight = {
    "state": {
        "on": boolean,
        "bri": number,
        "hue": number,
        "sat": number,
        "effect": string,
        "xy": [number, number],
        "ct": number,
        "alert": string,
        "colormode": string,
        "mode": string,
        "reachable": boolean
    },
    "swupdate": {
        "state": string,
        "lastInstall": string,
    },
    "type": string,
    "name": string,
    "modelid": string,
    "manufacturername": string,
    "productname": string,
    "capabilities":{
        "certified":boolean,
        "control":{
            "mindimlevel":number,
            "maxlumen":number,
            "colorgamuttype":string,
            "colorgamut":[[number,number],[number,number],[number,number]],
            "ct":{
                "min":number,
                "max":number
            }
        },
        "streaming":{
        "renderer":boolean,
        "proxy":boolean
        }
    },
    "config":{
        "archetype":string,
        "function":string,
        "direction":string,
        "startup":{
            "mode":string,
            "configured":boolean
        }
    },
    "uniqueid":string,
    "swversion":string,
    "swconfigid":string,
    "productid":string
}


declare type EntertainmentArea = {
    "name":string,
    "lights": number[],
    "sensors": any[],
    "type":string,
    "state": {
        "all_on":boolean,
        "any_on":boolean,
    },
    "recycle":false,
    "class":string,
    "action":{
    "on": boolean,
    "bri": number,
    "hue": number,
    "sat": number,
    "effect":string,
    "xy":[number, number],
    "ct":number,
    "alert":string,
    "colormode":string
}