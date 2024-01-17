Item {
	anchors.fill: parent
	Column {
		width: parent.width
		height: parent.height
		Column {
			width: 450
			height: 115
			Rectangle {
				width: parent.width
				height: parent.height - 10
				color: "#141414"
				radius: 5
				Column {
					x: 10
					y: 10
					width: parent.width - 20
					spacing: 0
					Text {
						color: theme.primarytextcolor
						text: "Discover Aura device by IP"
						font.pixelSize: 16
						font.family: "Poppins"
						font.bold: true
					}
					Row {
						spacing: 6
						Image {
							x: 10
							y: 6
							height: 50	
							source:	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAyCAIAAACbAbG0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGWGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDg4LCAyMDIwLzA3LzEwLTIyOjA2OjUzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA4LTA5VDEzOjIxOjQyKzAyOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIzLTA4LTA5VDEzOjIxOjQyKzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wOC0wOVQxMzoyMTo0MiswMjowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxMDUxZGFlMS1lODBhLTUzNGEtYTc0My02ZDc0MDY1ZGEwNTkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1NTc4YjkxNS1hYTVhLWFiNDQtYWY4MC0zOGRiZTJiOTVlYjciIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphOTdlNTk4Zi05MWM5LTg0NGEtOWY4ZC1lMGNjYzQxNjY4ODciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphOTdlNTk4Zi05MWM5LTg0NGEtOWY4ZC1lMGNjYzQxNjY4ODciIHN0RXZ0OndoZW49IjIwMjMtMDgtMDlUMTM6MjE6NDIrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4wIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MTA1MWRhZTEtZTgwYS01MzRhLWE3NDMtNmQ3NDA2NWRhMDU5IiBzdEV2dDp3aGVuPSIyMDIzLTA4LTA5VDEzOjIxOjQyKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6MjFmM2IzOTgtMTk1NS1jMDRjLThiY2YtZGExYWRhZGQ2MWY3PC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+YKhCVwAAB/9JREFUaIHtWduLJUcZ/1V19ZzbnJ3bntlxw2RXQ0w2boRFdIMP6w0hCCJEBMWHYPIm+Jb4VwgKgg8B8QJ5ifhmohJQog+LMSwRzcIaXFgyu9nZzJzMzDl9bt1Vnw99Tp+vq7rrdDLzEFk/mqG6u+qr3++71Xd6hMDJSKqHPmKqAMgT0vPRlZNheFKBwFWdlM7/+/B/X8RxgsGzlgAxqxYi/7BwXKaN6/lwct/78ARLyPGFyv3skfvSh6Lo1mOnMj9XTx5/pFTXUzgzx5CfRZ68t1UcG5lHD7G3xJ4IBwzlJ8zVugwFIAEB1AAlhbWAgImhZBGyDyRZqhRC5NMCgTAfdgJIDI0BALpIg7KAZvS2l9Wjm/XbRzGImCFFrM07h3FCi5O+OnNiHnBVZcAEsByIrZUwt4UQZ9vh23vjW71YAsY5YJSrJb0eOV3f6Y6vH8R8djrgJrdoWIXLH6jZcsMweCYnQDeh/f2J1dnFY/3Jjfo7vdiwqiE4Wiv9BNAE6krs9hI5s66ZmccACWAA7VyGDUyFPLSAZrsYpsSUP6QZk3v9pKZEi+HnaqV1n/5drQVCir4mYiFEeWdSfgBnprvKdYs7zRq4b91XEQFCrDUCFJGch1WWgQLoLKvDKOHlpLpwS/mJnZRooNuPO8uhYLtnACTyjyQggY2W2u3FVRBb54o72T14RP5aOK1sX/73Xi/eaAUBc1ImkitKBw1gpaW6UVJ49Puhwwvag9XDqmwjftsd6HZDNUWB1XI+nCWh1Jr6mlyNZbYXjvH8fnM978IqnFO2RWRoEpu1WpC9krzSyPzi063wIEpiVs0L8blw/beuVFkuF20KgAANHERJp63gLLGjVAJnVsNulHAchSRl+fbWK1l+uSHg3no24td+lGyuLAWOjVRmiVRRHWgtBe/1Y8kqXqETRN7JljmsVYUayBm7nWf2tgxDttd7/eTCWdEABuzEnzPMLLG6JBNtegl5kGUiHXqeVMluiQ3gDChv2eqHSmQoTmi9HgxHmmNQYFFBwNZKOJiYuAK9bIJkhiwblIl7jlsDUwFDukUC9MZma2VpZzRMTZ/2PcoK/U47vP3+JFvsCQ84TivMKFQgaV2GMRQVOoR5oB5OzndqwS4M213xStAAGqHc602TEEBQ9rMyb7/CcrKQpNWCuY0oWKCWkeQAuv3kwtlGC4iYfsXtvVqTgRL9hNKfITxbrJRwfSiBAAgABSggcEha3DLlGT0NJEDCmnjuWCt1BQOWMYwMQYr1RjAY6vSJAZRkHjhzKjyKkqTo6w05D63wTumFs2tKUkAIX5RO6ZkpvRiIZzwF+wHB09WDRwOHvXjzVHhnqLM5cx8GwMay2j2Ig5L0c83meq8GNCQaAk2FZgOBnM93vZcpNAaDEaIJhsDQYAJI9kOsMA/diE3B7B3G252a2kUyCw2VQWwAa8vhjZ1hUG5y94iTzHt1oC6xUcOVL25+/slH26fqlau96PfGV1+98Zc/3d0bYmgwAmJGEo4Dy+QgSi5+vNUE+rNEmzNcq0mAhrFZcnzloZrmWwjUBZoCnzgrn/7BEx97cO2N1/5z51Y3iZMpIO/RFoZqa3vta9++dPlLvV/+5OrbOzogjGgari5Dl2oGeKxJJ7TeCIZDPU3g1VnmXOzU1trq2s3IrZMehql1agGawGcvtZ95/sqNN2+/9PM373Zn4KhCoRdQwOYqvvX04xcvn/vVj/969fXDATDW80AtE6vSGuDS+WZ/pP9xd5wAk7TSBMASsLUevn8waQFB+htEzLf3gJMSoUQd+PJXzjz17OWXX7z2+5d3jjTGGjHNP355JA2iUGB0gBd++s+v/nvvmee+cPrXb7z6hzvDADFBe0/99DPZNFcJmjCIkq1O7cbd8TCrNBJoAue3m/FRf7uNIGD0UOJE9nh1RT75zU89/sS5X/zotat/P+wbDM08ixYe1imAmBAnSCR+98q7997987M/vPLQhc4rL/2re6AJUxUpmJSSECxEM5IErdGUk3MPrDav98ap/g2gBpwCvveNB77+nU9PRhqYfioUNhjYaAlCyuZK487N/Rd/9rfrNycDmhbDJF8JFzJMS/ESUJdoCTxyTn33+5cffLgTHY6IdNlyshKcAIiluvrjb9964Te3joARINaBGtAGtpv43GfW2stKZvQsngJiZjCmUOzfG1x/q98dYWAwohw9P0Oe8Nl5My1aEms1PPZYq7PVApFbwy21NHtEQD/Sr1/r3uqjD4xThmmhbwE1oC4RSMhZHhb+W2O6BwGAJiQGE8LIYIJielUYSubJcIZkSUAJSDmd4ymnRNMoTQzGBiNgAAyBGFBpfzQGDDACIoPA5BqusuY7FZNvuCx6vNBb3Z/VNrjNd2ymnAv7Ps6QXxmSeIZE0awepJ96uVKu2kLGcfOmWTNuZb0ITx4qIpnqifNfa6x9kVdCbFPNPltTytAwA2Rtatl5aEULOVdh+hX2XDyjRP5WFzXubqDyE5/yxs0wqGySnjW7GUOXXqEt3TPXT48/t7QZlhdWyBSVchuA26nT/fA/YGXd86pQRcjx4XHE0sA9SSVzkAfgvlWFSikfQgsxuZlZUaxAtX5neXa0nhQCmObhQsQLIX6IVX5tH3SOP45shtV34jOPz6361gt9aIly17ihUpgPZXtXqaLWqrJ08Adq4eFhxVRBlJap9mM9QR9W0eZWHZ8PKX8E+ds//5ZVKlNFqWjQQoZWKP0X5U7a9AeRReMAAAAASUVORK5CYII=" 			//https://images.prismic.io/leetdesk/5225a393-a9b8-43dd-aa62-4e403627ba27_aura-desk.jpg?auto=compress,format"
							fillMode: Image.PreserveAspectFit
							antialiasing: false
							mipmap: false
						}
						Rectangle {
							x: 10
							y: 6
							width: 200			
							height: 50
							radius: 5
							border.color: "#1c1c1c"
							border.width: 2
							color: "#141414"
							TextField {
								width: 180
								leftPadding: 10
								rightPadding: 10
								id: discoverIP
								x: 10
								color: theme.primarytextcolor
								font.family: "Poppins"
								font.bold: true
								font.pixelSize: 20
								verticalAlignment: TextInput.AlignVCenter
								placeholderText: "192.168.0.1"
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
				Column {
					x: 260
					y: 4
					width: parent.width - 20
					spacing: 10
					Image {
						x: 10
						y: 10
						height: 50				
						//source: ""
						fillMode: Image.PreserveAspectFit
						antialiasing: false
						mipmap: false
					}
				}
				Column {
					x: 300				
					y: 50				
					width: parent.width - 20
					spacing: 10
					Item{
						Rectangle {
							width: 120			
							height: 26			
							color: "#D65A00"
							radius: 5
						}
						width: 120					
						height: 26					
						ToolButton {
							height: 30
							width: 120
							anchors.verticalCenter: parent.verticalCenter
							font.family: "Poppins"
							font.bold: true
							//icon.source: "https://raw.githubusercontent.com/SRGBmods/public/main/images/wled/icon-discover.png"
							text: "Discover"
							anchors.right: parent.right
							onClicked: {
								discovery.forceDiscover(discoverIP.text);
							}
						}
					}
				}
			}
		}

		ListView {
			id: controllerList
			model: service.controllers   
			width: contentItem.childrenRect.width + (controllerListScrollBar.width * 1.5)
			height: parent.height - 150
			clip: true

			ScrollBar.vertical: ScrollBar {
				id: controllerListScrollBar
				anchors.right: parent.right
				width: 10
				visible: parent.height < parent.contentHeight
				policy: ScrollBar.AlwaysOn

				height: parent.availableHeight
				contentItem: Rectangle {
					radius: parent.width / 2
					color: theme.scrollBar
				}
			}


			delegate: Item {
				visible: true
				width: 450
				height: 115
				property var device: model.modelData.obj

				Rectangle {
					width: parent.width
					height: parent.height - 10
					color: device.offline ? "#101010" : device.connected ? "#003EFF" : "#292929"
					radius: 5
				}
				Column {
					x: 260
					y: 4
					width: parent.width - 20
					spacing: 10
					/*Image {
						x: 10
						y: 10
						height: 50				
						source: device.offline ? "https://raw.githubusercontent.com/SRGBmods/public/main/images/wled/wled_logo_akemi_mono.png" : device.connected ? "https://raw.githubusercontent.com/SRGBmods/public/main/images/wled/wled_logo_akemi.png" : "https://raw.githubusercontent.com/SRGBmods/public/main/images/wled/wled_logo_akemi_mono.png"
						fillMode: Image.PreserveAspectFit
						antialiasing: false
						mipmap: false
					}*/
				}
				Column {
					x: 285
					y: 60
					width: parent.width - 20
					spacing: 10
					Item{
						Rectangle {
							width: 120
							height: 26
							color: device.offline ? "#C0A21B" : device.connected ? "#292929" : "#003EFF"
							radius: 5
							MouseArea {
								anchors.fill: parent
								acceptedButtons: Qt.NoButton
								cursorShape: Qt.ForbiddenCursor
							}
						}
						width: 120
						height: 26
						ToolButton {
							height: 30
							width: 120
							anchors.verticalCenter: parent.verticalCenter
							font.family: "Poppins"
							font.bold: true 
							visible: device.offline ? false : device.connected
							text: "Unlink"
							anchors.right: parent.right
							onClicked: {
								device.startRemove();
							}
						}
						ToolButton {
							height: 30
							width: 120
							anchors.verticalCenter: parent.verticalCenter
							font.family: "Poppins"
							font.bold: true 
							visible: device.offline ? false : !device.connected
							text: "Link"
							anchors.right: parent.right
							onClicked: {
								device.startLink();
							}
						}
						Text {
							anchors.verticalCenter: parent.verticalCenter
							anchors.horizontalCenter: parent.horizontalCenter
							color: theme.primarytextcolor
							font.pixelSize: 15
							font.family: "Poppins"
							font.bold: true 
							visible: device.offline
							text: "OFFLINE!"
						}
					}
				}
				Column {
					x: 10
					y: 4
					spacing: 6
					Row {
						width: parent.width - 20
						spacing: 6

						Text {
							color: theme.primarytextcolor
							text: device.name
							font.pixelSize: 16
							font.family: "Poppins"
							font.bold: true
						}
						Image {
							y: 3
							id: iconSignalStrength
							source: device.offline ? "https://images.prismic.io/leetdesk/cfc6ba3e-0031-43be-94d7-8f697f3cb895_device-delete.png?auto=compress,format" : device.signalstrength >= 90 ? "https://images.prismic.io/leetdesk/8adfbe2e-2fa1-4395-b0f6-f7730b259641_device-signal4.png?auto=compress,format" : device.signalstrength >= 75 ? "https://images.prismic.io/leetdesk/93c547e2-f922-4957-8b4b-5ef05d80f3b8_device-signal3.png?auto=compress,format" : device.signalstrength >= 60 ? "https://images.prismic.io/leetdesk/b723b3ce-6f62-41af-ba3d-ee3af0f88092_device-signal2.png?auto=compress,format" : device.signalstrength >= 50 ? "https://images.prismic.io/leetdesk/bc59ca36-cff2-464a-9889-d01fe3b1b256_device-signal1.png?auto=compress,format" : "https://images.prismic.io/leetdesk/7d6d6e19-1fb3-4b6d-8192-1b695052dec5_device-signal0.png?auto=compress,format"
						}
					}
					Row {
						spacing: 6
						Image {
							visible: device.offline ? false : true
							id: iconTurnOn
							source: "https://images.prismic.io/leetdesk/7dfd32bd-f15a-481c-90c5-ca13cc1b83f0_device-turnon.png?auto=compress,format"
							width: 16; height: 16
							opacity: 1.0
							MouseArea {
								anchors.fill: parent
								hoverEnabled: true
								acceptedButtons: Qt.LeftButton
								onClicked: {
									 device.turnOn();
								}
								onEntered: {
									iconTurnOn.opacity = 0.8;
								}
								onExited: {
									iconTurnOn.opacity = 1.0;
								}
							}
						}
						Image {
							visible: device.offline ? false : true
							id: iconTurnOff
							source: "https://images.prismic.io/leetdesk/7763abbb-720c-4b81-b787-df0fb60f3709_device-turnoff.png?auto=compress,format"
							width: 16; height: 16
							opacity: 1.0
							MouseArea {
								anchors.fill: parent
								hoverEnabled: true
								acceptedButtons: Qt.LeftButton
								onClicked: {
									 device.turnOff();
								}
								onEntered: {
									iconTurnOff.opacity = 0.8;
								}
								onExited: {
									iconTurnOff.opacity = 1.0;
								}
							}
						}
						Image {
							id: iconDelete
							source: "https://images.prismic.io/leetdesk/cfc6ba3e-0031-43be-94d7-8f697f3cb895_device-delete.png?auto=compress,format"
							width: 16; height: 16
							visible: device.forced ? true : false
							opacity: 1.0
							MouseArea {
								anchors.fill: parent
								hoverEnabled: true
								acceptedButtons: Qt.LeftButton
								onClicked: {
									 device.startDelete();
								}
								onEntered: {
									iconDelete.opacity = 0.8;
								}
								onExited: {
									iconDelete.opacity = 1.0;
								}
							}
						}
						Image {
							id: iconForceAdd
							source: "https://images.prismic.io/leetdesk/8590f35c-d423-4114-839c-96d2a8a923b0_device-forceadd.png?auto=compress,format"
							width: 16; height: 16
							visible: device.forced ? false : true
							opacity: 1.0
							MouseArea {
								anchors.fill: parent
								hoverEnabled: true
								acceptedButtons: Qt.LeftButton
								onClicked: {
									 device.startForceDiscover();
								}
								onEntered: {
									iconForceAdd.opacity = 0.8;
								}
								onExited: {
									iconForceAdd.opacity = 1.0;
								}
							}
						}
					}
					Text {
						color: theme.primarytextcolor
						text: "MAC: " + device.mac + "  |  IP: " + device.ip + ":" + device.streamingPort
					}
					Text {
						color: theme.primarytextcolor
						text: "Arch: " + device.arch + " @ " + device.firmwareversion + "  |  LED count: " + device.deviceledcount
					}		  
				}
			}
		}
	}
}