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
					text: "Searching network for Nanoleaf Controllers" 
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
		
        Repeater {
			model: service.controllers          
			delegate: Item {
				width: 300
            	height: content.height + 100 //margins plus space

				Rectangle {
					width: parent.width
					height: parent.height - 10
					color: "#3baf29"
					radius: 5
				}
				Image {
					x: 10
					y: 10
					height: 50                
					source: "https://marketplace.signalrgb.com/brands/products/nanoleaf/dark_logo.png"
					fillMode: Image.PreserveAspectFit
					antialiasing: true
					mipmap:true
				}
				Column {
					id: content
					x: 10
					y: 80
					width: parent.width - 20
					spacing: 10
					
					Text{
						color: theme.primarytextcolor
						text: model.modelData.obj.name
						font.pixelSize: 16
						font.family: "Poppins"
						font.bold: true
					}
					Text{
						color: theme.primarytextcolor
						text: "Id: " + model.modelData.obj.id
					}
					Text{
						color: theme.primarytextcolor
						text: "Firmware v"+model.modelData.obj.firmwareVersion
					}    
					Item{
						width: parent.width
						height: 50

						Rectangle {
							width: parent.width
							height: parent.height
							color: "#22ffffff"
							radius: 5
						}
						Text{
							height: parent.height
							x: 10
							color: theme.primarytextcolor
							verticalAlignment: Text.AlignVCenter
							text: (model.modelData.obj.connected === true) ? "Linked" : (model.modelData.obj.waitingforlink === true) ? "Waiting For Link..."+model.modelData.obj.retriesleft : "Not Linked"
						}
						ToolButton {        
							height: 50
							width: 120
							anchors.verticalCenter: parent.verticalCenter
							font.family: "Poppins"
							font.bold: true 
							visible: !model.modelData.obj.connected && !model.modelData.obj.waitingforlink  
							text: "Link"
							anchors.right: parent.right
							onClicked: {
								model.modelData.obj.startLink();
							}
						}
						BusyIndicator {
							y: 10
							height: 30
							width: parent.height
							Material.accent: "#88FFFFFF"
							anchors.right: parent.right
							visible: model.modelData.obj.waitingforlink === true
						}
					}    
					Text{
						width: parent.width
						color: theme.primarytextcolor
						verticalAlignment: Text.AlignVCenter
						visible: !model.modelData.obj.connected
						text: "To link this controller start the linking process above and then put the controller into pairing mode."
						wrapMode: Text.WrapAtWordBoundaryOrAnywhere
					}      
				}
			}  
        }
    }
}