package com.socceradda.service.dto;

public class ImageDTO {

	private String base64;
	// just base64 string is enough. If you want, send additional details
	private String name;
	private String type;

	public String getBase64() {
		return base64;
	}

	public void setBase64(String base64) {
		this.base64 = base64;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

}
