declare type NanoLeafResponsePacket = {
    name: string,
    serialNo: string,
    manufacturer: string,
    firmwareVersion: string,
    model: string,
    state: {

    }
    panelLayout: NanoLeafPanelLayout
    rhythm: NanoLeafRhythm
}

declare type NanoLeafPanelLayout = {
    layout: {
        numPanels: number,
        sideLegth: number,
        positionData: NanoLeafPanelInfo[]
    }
    globalOrientation: {
        value: number,
        max: number,
        min: number
    }
}

declare type NanoLeafPanelInfo = {
            "panelId": number,
            "x": number,
            "y": number,
            "o": number,
            "shapeType": number
}

declare type NanoLeafRhythm = {
      "rhythmConnected": boolean,
      "rhythmActive": boolean,
      "rhythmId": number,
      "hardwareVersion": string,
      "firmwareVersion": string,
      "auxAvailable": boolean,
      "rhythmMode": number,
      "rhythmPos": NanoLeafPosition
}

declare type NanoLeafPosition = {
        "x": number,
        "y": number,
        "o": number
}
//     "state": {
//       "on": {
//         "value": false
//       },
//       "brightness": {
//         "value": 100,
//         "max": 100,
//         "min": 0
//       },
//       "hue": {
//         "value": 0,
//         "max": 360,
//         "min": 0
//       },
//       "sat": {
//         "value": 0,
//         "max": 100,
//         "min": 0
//       },
//       "ct": {
//         "value": 4000,
//         "max": 100,
//         "min": 0
//       },
//       "colorMode": "effect"
//     },
//     "effects": {
//       "select": "Flames",
//       "effectsList": [
//         "Color Burst",
//         "Flames",
//         "Forest",
//         "Inner Peace",
//         "Nemo",
//         "Northern Lights",
//         "Romantic",
//         "Snowfall"
//       ]
