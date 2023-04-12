Item {
    anchors.fill: parent

    Column{
        width: parent.width
        height: parent.height

		Rectangle{
			id: scanningItem
			height: 50
			width: childrenRect.width + 15
			visible: service.controllers.length == 0
			color: theme.background3
			radius: theme.radius

			BusyIndicator {
				id: scanningIndicator
				height: 30
				anchors.verticalCenter: parent.verticalCenter
				width: parent.height
				Material.accent: "#88FFFFFF"
				running: scanningItem.visible
			}  

			Column{
				width: childrenRect.width
				anchors.left: scanningIndicator.right
				anchors.verticalCenter: parent.verticalCenter

				Text{
					color: theme.secondarytextcolor
					text: "Searching network for Philip's Hue Bridges" 
					font.pixelSize: 14
					font.family: "Montserrat"
				}
				Text{
					color: theme.secondarytextcolor
					text: "This may take several minutes..." 
					font.pixelSize: 14
					font.family: "Montserrat"
				}
			}
		}

        Repeater{
        model: service.controllers          

        delegate: Item {
            width: 300
            height: content.height + 30 //margins plus space
			property var bridge: model.modelData.obj

            Rectangle {
                width: parent.width
                height: parent.height - 10
                color: theme.background3
                radius: 5
            }
            Column {
                id: content
                x: 10
                y: 10

                Text{
                    color: theme.primarytextcolor
                    text: bridge.name
                    font.pixelSize: 16
                    font.family: "Poppins"
                    font.bold: true
                }
                Text{
                    color: theme.secondarytextcolor
                    text: "Id: " + bridge.id
                }
                Text{
                    color: theme.secondarytextcolor
                    text: "Model: "+ bridge.model
                }  
                Text{
                    color: theme.secondarytextcolor
                    text: "API Version: "+ bridge.apiversion
                }

                Text{
                    color: theme.secondarytextcolor
                    text: "Ip Address: " + (bridge.ip != "" ? bridge.ip : "Unknown")
                }

                Text{
                    color: theme.secondarytextcolor
                    text: "Linked"
                    visible: bridge.connected
                }
                
                Text{
                    color: theme.warn
                    text: "Bridge firmware doesn't allow streaming. API Version must be atleast 1.22.0"
                    visible: !bridge.supportsStreaming && bridge.apiversion != ""
                    wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                    font.pixelSize: 12
                    width: parent.width
                }

                Item{
                    visible: !bridge.connected && bridge.supportsStreaming
                    width: parent.width
                    height: 60

                    Rectangle {
                        width: parent.width
                        anchors.verticalCenter: parent.verticalCenter
                        height: 50
                        color: "#22ffffff"
                        radius: 5
                    }

                    Text{
                        x: 10
                        height: parent.height
                        verticalAlignment: Text.AlignVCenter
                        color: theme.primarytextcolor
                        visible: bridge.waitingforlink
                        text: (bridge.waitingforlink === true) ? "Waiting For Link... "+bridge.retriesleft : ""
                    }
                    ToolButton {        
                        height: 50
                        width: parent.width
                        anchors.verticalCenter: parent.verticalCenter
                        font.family: "Poppins"
                        font.weight: Font.Bold
                        visible: !bridge.connected && !bridge.waitingforlink  
                        text: "Start Link"
                        anchors.right: parent.right
                        onClicked: {
                        bridge.startLink();
                        }
                    }

                    BusyIndicator {
                        height: 30
                        anchors.verticalCenter: parent.verticalCenter
                        width: parent.height
                        Material.accent: "#88FFFFFF"
                        anchors.right: parent.right
                        visible: bridge.waitingforlink === true
                    } 
                }

                Text{
                    width: parent.width
                    verticalAlignment: Text.AlignVCenter
                    color: theme.secondarytextcolor
                    visible: !bridge.connected
                    text: "To link this Bridge start the linking process above and then click the bridge's center button."
                    wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                }
                Text{
                    width: parent.width
                    color: theme.warn
                            text: "This bridge has no Entertainment zones. You'll need to create on in the Philip's Hue app."
                    visible: bridge.connected && bridge.supportsStreaming && Object.keys(bridge.areas) == 0
                    wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                }

                ComboBox{
                    id: areaComboBox
                    width: parent.width
                    model: Object.values(bridge.areas)
                    textRole: "name"
                    valueRole: "id"
                    property bool ready: false
                    visible: bridge.connected && bridge.supportsStreaming && areaComboBox.model.length > 0
                    onCurrentValueChanged: {
                        if(!ready) return;
                        console.log(areaComboBox.currentText, areaComboBox.currentValue)
                        bridge.setSelectedArea(areaComboBox.currentValue);
                    }
                    Component.onCompleted: {
                        console.log("Selecting Default", bridge.selectedAreaName)
                        let idx = areaComboBox.find(bridge.selectedAreaName)
                        console.log(idx)
                        if(idx >= 0){
                            areaComboBox.currentIndex = idx;
                        }
                        ready = true;
                    }
                }        
            }
        }  
        }
    }
}