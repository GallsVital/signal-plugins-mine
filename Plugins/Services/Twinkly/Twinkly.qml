Item {
    anchors.fill: parent

    Column{
        width: parent.width
        height: parent.height
        spacing: 10

		Rectangle{
			id: scanningItem
			height: 100
			width: childrenRect.width + 15
			visible: service.controllers.length === 0
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
					text: "Searching network for Twinkly Devices..." 
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
                width: 250
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
                            width: 250
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
                            }

                            Row{
                                spacing: 5
                                Text{
                                    color: theme.secondarytextcolor
                                    text: "Ip Address: " + (device.ip != "" ? device.ip : "Unknown")
                                }

                            }
                        }
                    }
                }
            }  
        }


        Column{
            Label{
                text: "Force Discovery Using IP Address: "
                color: theme.primarytextcolor
		    	font.family: "Poppins"
		    	font.bold: true
		    	font.pixelSize: 15
            }

            Rectangle {
			width: 200
			height: 30
			radius: 5
			border.color: "#1c1c1c"
			border.width: 1
			color: Qt.lighter(theme.background1, 1.3)
			    TextField {
			    	width: 180
			    	leftPadding: 10
			    	rightPadding: 10
			    	id: discoverIP
			    	color: theme.secondarytextcolor
			    	font.family: "Poppins"
			    	font.pixelSize: 15
			    	verticalAlignment: TextInput.AlignVCenter
			    	placeholderText: "IP Address"
			    	onEditingFinished: {
			    		discovery.forceDiscover(discoverIP.text);
			    	}
			    	validator: RegularExpressionValidator {
			    		regularExpression:  /^((?:[0-1]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.){0,3}(?:[0-1]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/
			    	}
			    	background: Item {
			    		width: parent.width
			    		height: parent.height
			    		Rectangle {
			    			color: "transparent"
			    			height: 1
			    			width: parent.width
			    			anchors.bottom: parent.bottom
			    		}
			    	}
			    }
			}
        }
    }
}