import { App, PluginSettingTab, Setting } from "obsidian";
import LlmSummaryPlugin from "./main";
import { validate_token } from "api/hf";

export interface LlmSummarySettings {
	hf_token: string;
	token_valid: boolean;
}

export const DEFAULT_SETTINGS: LlmSummarySettings = {
	hf_token: "",
	token_valid: false,

};

export class LlmSummarySettingsTab extends PluginSettingTab {
	plugin: LlmSummaryPlugin;

	constructor(app: App, plugin: LlmSummaryPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	refresh() { this.display(); }

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		void this.renderSettings(containerEl);
	}

	private async renderSettings(containerEl: HTMLElement){
		const token  = this.plugin.settings.hf_token;
		const {isValid, name, auth} =  await validate_token(token);

		this.plugin.settings.token_valid = isValid; 
		await this.plugin.saveSettings();


		if(isValid){
			new Setting(containerEl)
			.setName("Hugging face API key")
			.setDesc("Your token is valid.")
			.addText(text => text .setValue(`Name: ${name}`) .setDisabled(true) )
			.addText(text => text .setValue(`auth: ${JSON.stringify(auth)}`) .setDisabled(true))
			.addButton(btn => {
				btn.setButtonText("Reset").setWarning().onClick(async () => {
					this.plugin.settings.hf_token = "";
					this.plugin.settings.token_valid = false;
					await this.plugin.saveSettings();
					this.refresh();
				})
			})
			return ;
		}
		else{

			new Setting(containerEl)
			.setName("Hugging face API key")
			.setDesc("Create a token at https://huggingface.co/settings/tokens")
			.addText((text) =>{

				return text
				.setPlaceholder("Enter your secret")
				.setValue(this.plugin.settings.hf_token)
					.onChange(async (value) => {
						this.plugin.settings.hf_token = value;
						await this.plugin.saveSettings();
					})
				}
			)
			.addButton((btn) => {
				btn.setButtonText("Validate")
					.setCta()
					.onClick(async () => {
						const token  = this.plugin.settings.hf_token;
						const {isValid} = await validate_token(token);
						this.plugin.settings.token_valid = isValid;
						await this.plugin.saveSettings();
						this.refresh();

					});
			});

		}



		
	}


	
}
