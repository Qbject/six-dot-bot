import Block from "../block.js";
import { build, buildButton } from "../util.js";

export default class ImagBlock extends Block {
	static name = "Uploaded Image";
	static typeName = "image";

	getDefaultProps() {
		return {
			imageURL: "/img/image-placeholder-alt.svg"
		}
	}

	buildContent() {
		this.blockElement.classList.add("image");
		this.imageElement = build("img", this.blockElement);
		this.imageElement.alt = "";
	}

	buildSettings() {
		this.settingsElement.classList.add("image");

		this.previewElement = build("img.preview", this.settingsElement);
		this.previewElement.alt = "";
		this.previewElement.addEventListener("click", () =>
			this.fileInput.click());

		const hintElement = build("div.hintAddin", this.settingsElement);
		hintElement.textContent =
			"Click on the preview to upload another file";

		this.fileInput = build("input", this.settingsElement);
		this.fileInput.classList.add("fileInput");
		this.fileInput.type = "file";
		this.fileInput.accept = "image/*";
		this.fileInput.multiple = false;
		this.fileInput.hidden = true;

		const updatePreview = async () => {
			const imageURL = (await this.readFileInput()) ||
				this.props.imageURL;
			this.previewElement.src = imageURL;
		}

		this.fileInput.addEventListener("change", updatePreview);
		updatePreview();
	}

	async readSettings() {
		const imageURL = (await this.readFileInput()) || this.props.imageURL;
		return { imageURL };
	}

	async applyProps(props) {
		this.props = props;

		this.imageElement.src = props.imageURL;
	}

	readFileInput() {
		return new Promise((resolve, reject) => {
			if (!this.fileInput.files.length) {
				resolve(null);
				return;
			};

			const reader = new FileReader();
			reader.onload = e => resolve(e.target.result);
			reader.onerror = e => reject(e.target.error);

			reader.readAsDataURL(this.fileInput.files[0]);
		});
	}
}