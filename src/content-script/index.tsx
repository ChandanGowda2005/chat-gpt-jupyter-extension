import 'github-markdown-css';
import { render, createRef } from 'preact';
import { Button, LabArea } from './Interface';
import { config, NotebookInterface } from './interface-configs.js';
import './styles.scss';
import { promptSettings } from './prompt-configs.js';
import { CopilotIcon } from '@primer/octicons-react';
import { submit_and_add_question } from './ChatGPTRender';
import Browser from 'webextension-polyfill'

import VoiceRecorder from './voiceRecorder';
import FloatingInput from './FloatingInput';

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

async function identify_notebook_type(config: Record<string, NotebookInterface>) {
  const maxTries = 30;
  let tries = 0;

  while (tries < maxTries) {
    for (const [key, value] of Object.entries(config)) {
      const parent = document.querySelector<HTMLElement>(value.buttonParent);
      if (parent && parent.offsetParent !== null) {
        console.log('ChatGPT Jupyter: Identified notebook type as: ' + key);
        return key;
      }
    }
    tries += 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null;
}

function attach_lab_area() {
  const parentArea = document.querySelector('#jp-left-stack');
  const area_container = document.createElement('span');
  area_container.className = 'chat-gpt-area';
  parentArea!.append(area_container);
  if (!parentArea) {
    console.log('ChatGPT Jupyter: Error - could not find parent area');
    return;
  }
  render(<LabArea />, area_container);
}

function create_interface(siteConfig: NotebookInterface, siteName: string) {
  const toolbar = document.querySelector(siteConfig.buttonParent);
  const controls_container = document.createElement('span');
  controls_container.className = 'chat-gpt-controls';
  toolbar!.append(controls_container);

  // Attach manual close to make sure the closing button still works in Jupyter Notebook
  if (siteName === 'notebook') {
    const closeButton = document.querySelector(
      'div#pager-button-area > a[title="Close the pager"]',
    );
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        const resultContainerParent = document.querySelector<HTMLElement>(
          siteConfig.resultContainer,
        );
        if (resultContainerParent) {
          resultContainerParent.style.display = 'none';
        }
      });
    }
  }

  const floatingInputRef = createRef<any>();

  const buttons = [
    <Button
        id = "ai_ext_null"
      name="ChatGPT:"
      onClick={() => null}
      icon={CopilotIcon}
      disabled={true}
      siteName={siteName}
    />,
    ...Object.keys(promptSettings).map((key) => {
      const prompt = promptSettings[key];
      if (prompt.buttonLabel === 'Question') {
        return (
          <Button
            id = {prompt.buttonId}
            name={prompt.buttonLabel}
            onClick={() => floatingInputRef.current.openFloatingInput()}
            icon={prompt.buttonIcon}
            siteName={siteName}
          />
        );
      } else {
        return (
          <Button
            id = {prompt.buttonId}
            name={prompt.buttonLabel}
            onClick={() =>
              submit_and_add_question(key, siteConfig, siteName)
            }
            icon={prompt.buttonIcon}
            siteName={siteName}
          />
        );
      }
    }),
    <VoiceRecorder siteName={siteName} siteConfig={siteConfig} />,
  ];

  render(buttons, controls_container);

  const floatingInputContainer = document.createElement('div');

  let sideBody = document.querySelector('body');
  if (siteName === 'notebook') {
    sideBody = document.querySelector('#ipython-main-app');
  } 

    if (!sideBody) {
        console.log('ChatGPT Jupyter: Error - could not find side body');
        return
    }

    sideBody.appendChild(floatingInputContainer);
            render(
            <FloatingInput
            ref={floatingInputRef}
            onSubmit={(questionText) => submit_and_add_question(
                "question",
                siteConfig,
                siteName,
                questionText
            )}
            />,
            floatingInputContainer,
            );
}

/* -------------------------------------------------------------------------- */
/*                             Shortcut listeners                             */
/* -------------------------------------------------------------------------- */ 

Browser.runtime.onMessage.addListener((message: any, sender: Browser.Runtime.MessageSender): void | Promise<any> => {
    if (message.action === 'formatCode') {
      const button = document.querySelector('#ai_ext_format_code') as HTMLButtonElement;
      if (button) { button.click() }
    }

    if (message.action === 'explainCode') {
        const button = document.querySelector('#ai_ext_explain_code') as HTMLButtonElement;
        if (button) { button.click() }
    }

    if (message.action === 'debugCode') {
        const button = document.querySelector('#ai_ext_debug_code') as HTMLButtonElement;
        if (button) { button.click() }
    }

    if (message.action === 'completeCode') {
        const button = document.querySelector('#ai_ext_complete_code') as HTMLButtonElement;
        if (button) { button.click() }
    }

    if (message.action === 'reviewCode') {
        const button = document.querySelector('#ai_ext_review_code') as HTMLButtonElement;
        if (button) { button.click() }
    }

    if (message.action === 'askQuestion') {
        const button = document.querySelector('#ai_ext_question') as HTMLButtonElement;
        if (button) { button.click() }
    }

    if (message.action === 'voiceCommand') {
        const button = document.querySelector('#ai_ext_voice_command') as HTMLButtonElement;
        if (button) { button.click() }
    }
  });

/* -------------------------------------------------------------------------- */
/*                           Execute extension logic                          */
/* -------------------------------------------------------------------------- */

async function main() {
    const siteName = await identify_notebook_type(config);
    if (siteName) {
    // Get the config for the current site
    const siteConfig = config[siteName];
    
    // Add the extension interface
        create_interface(siteConfig, siteName);

        if (siteName === 'lab') {
        setTimeout(() => {
            attach_lab_area();
        }, 1000); // This is a quick hack, but it works
        }

        console.log('ChatGPT - Jupyter: active and ready!');

    }
}
    

main()

