import controlComponent from './Control';
import previewComponent from './Preview';

if (typeof window !== "undefined") {
	window.optionComponent = controlComponent;
	window.optionPreview = previewComponent;
}

export { controlComponent as optionComponent, previewComponent as optionPreview };
