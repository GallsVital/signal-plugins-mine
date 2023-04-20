Item {
    anchors.fill: parent

    Column{
        width: parent.width
        height: parent.height
        spacing: 10

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
					text: "Searching network for Philips Hue Bridges" 
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
                id: root
                width: 450
                height: content.height
                property var bridge: model.modelData.obj

                Rectangle {
                    width: parent.width
                    height: parent.height
                    color: Qt.lighter(theme.background2, 1.3)
                    radius: 5
                }

                Column{
                    id: content
                    width: parent.width
                    padding: 15
                    spacing: 5

                    Row{
                        width: parent.width
                        height: childrenRect.height

                        Column{
                            id: leftCol
                            width: 260
                            height: childrenRect.height
                            spacing: 5

                            Text{
                                color: theme.primarytextcolor
                                text: bridge.name
                                font.pixelSize: 16
                                font.family: "Poppins"
                                font.weight: Font.Bold
                            }

                            Row{
                                spacing: 5
                                Text{
                                    color: theme.secondarytextcolor
                                    text: "Id: " + bridge.id
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "|"
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "Model: "+ bridge.model
                                }  
                            }
                            Row{
                                spacing: 5
                                Text{
                                    color: theme.secondarytextcolor
                                    text: "Ip Address: " + (bridge.ip != "" ? bridge.ip : "Unknown")
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "|"
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "API Version: "+ bridge.apiversion
                                }  
                            }

                            Text{
                                color: theme.secondarytextcolor
                                text: "Status: Linked"
                                visible: bridge.connected
                            }

                        }
                        
                        Item{
                            width: root.width - leftCol.width - content.padding * 2
                            height: leftCol.height
                            Text{
                                text: "Streaming Area"
                                color: theme.secondarytextcolor
                                font.pixelSize: 12
                                anchors.bottom: areaComboBox.top
                            }

                            SComboBox{
                                id: areaComboBox
                                width: parent.width
                                model: Object.values(bridge.areas)
                                textRole: "name"
                                valueRole: "id"
                                property bool ready: false
                                visible: bridge.connected && bridge.supportsStreaming && areaComboBox.model.length > 0
                                anchors.verticalCenter: parent.verticalCenter

                                onActivated: {
                                    if(!ready){
                                        return
                                    };
                                    console.log(areaComboBox.currentText, areaComboBox.currentValue)
                                    bridge.setSelectedArea(areaComboBox.currentValue);
                                }
                                onModelChanged: {
                                    let idx = areaComboBox.find(bridge.selectedAreaName)
                                    console.log(idx)
                                    if(idx >= 0){
                                        areaComboBox.currentIndex = idx;
                                    } 
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

                            // SButton{
                            //     id: linkButton
                            //     height: 40
                            //     width: 140
                            //     anchors.verticalCenter: parent.verticalCenter
                            //     visible: !bridge.connected && !bridge.waitingforlink  
                            //     label{
                            //         text: "Start Link"
                            //         font.weight: Font.Bold
                            //         font.family: "Poppins"
                            //     }
                            //     //color: linkButton.hovered ? theme.
                            //     onClicked: {
                            //         bridge.startLink();
                            //     }
                            // }


                            Item{
                                visible: !bridge.connected && bridge.supportsStreaming
                                width: 140
                                height: 40
                                anchors.verticalCenter: parent.verticalCenter
                                anchors.right: parent.right
                                Rectangle {
                                    width: parent.width
                                    anchors.verticalCenter: parent.verticalCenter
                                    height: parent.height
                                    color: theme.background3
                                    radius: theme.radius
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
                                    height: parent.height
                                    width: parent.width
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: "Poppins"
                                    font.weight: Font.Bold
                                    visible: !bridge.connected && !bridge.waitingforlink  
                                    text: "Start Link"
                                    onClicked: {
                                        bridge.startLink();
                                    }
                                }

                                BusyIndicator {
                                    height: 30
                                    width: 30
                                    anchors.verticalCenter: parent.verticalCenter
                                    Material.accent: "#88FFFFFF"
                                    anchors.right: parent.right
                                    visible: bridge.waitingforlink === true
                                } 
                            }
                        }
                    }

                    Text{
                        width: parent.width - content.padding * 2
                        color: theme.warn
                        text: "Bridge firmware doesn't allow streaming. API Version must be atleast 1.22.0"
                        visible: !bridge.supportsStreaming && bridge.apiversion != ""
                        wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                        font.pixelSize: 12
                    }

                    Text{
                        width: parent.width - content.padding * 2
                        verticalAlignment: Text.AlignVCenter
                        visible: !bridge.connected
                        color: theme.secondarytextcolor
                        text: "To link this Bridge start the linking process above and then click the bridge's center button."
                        wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                        font.pixelSize: 12
                    }

                    Text{
                        width: parent.width - content.padding * 2
                        visible: bridge.connected && bridge.supportsStreaming && Object.keys(bridge.areas) == 0
                        color: theme.warn
                        text: "This bridge has no Entertainment zones. You'll need to create one in the Philips Hue app first."
                        wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                        font.pixelSize: 12

                    }

                }

            }  
        }
    }
}