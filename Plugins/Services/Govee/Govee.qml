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
					text: "Searching network for Govee Devices..." 
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
                width: 260
                height: content.height
                property var device: model.modelData.obj

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
                                text: device.name
                                font.pixelSize: 16
                                font.family: "Poppins"
                                font.weight: Font.Bold
                            }

                            Row{
                                spacing: 5
                                Text{
                                    color: theme.secondarytextcolor
                                    text: "Id: " + device.id
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "|"
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "SKU: "+ device.sku
                                }  
                            }

                            Row{
                                spacing: 5
                                Text{
                                    color: theme.secondarytextcolor
                                    text: "Ip Address: " + (device.ip != "" ? device.ip : "Unknown")
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "|"
                                }

                                Text{
                                    color: theme.secondarytextcolor
                                    text: "Wifi Version: "+ device.wifiVersionSoft
                                }  
                            }

                            Text{
                                color: theme.secondarytextcolor
                                text: `Supports DreamView Protocol: ${device.supportDreamView  ? "True" : "False"}`
                            }

                            Text{
                                color: theme.secondarytextcolor
                                text: `Supports Razer Protocol: ${device.supportRazer ? "True" : "False"}`
                            }

                            Text{
                                color: theme.warn
                                width: parent.width
                                visible: !device.supportDreamView && !device.supportRazer
                                wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                                text: `This device doesn't support Govee's Razer, or Dreamview protocols. SignalRGB is unable to control it...`
                            }

                        }

                    }
                }
            }  
        }
    }
}