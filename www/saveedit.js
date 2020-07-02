/******************************************************************************
 * Sonic CD Save Editor                                                       *
 *                                                                            *
 * Copyright (C) 2020 J.C. Fields (jcfields@jcfields.dev).                    *
 *                                                                            *
 * Permission is hereby granted, free of charge, to any person obtaining a    *
 * copy of this software and associated documentation files (the "Software"), *
 * to deal in the Software without restriction, including without limitation  *
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,   *
 * and/or sell copies of the Software, and to permit persons to whom the      *
 * Software is furnished to do so, subject to the following conditions:       *
 *                                                                            *
 * The above copyright notice and this permission notice shall be included in *
 * all copies or substantial portions of the Software.                        *
 *                                                                            *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,   *
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL    *
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER *
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING    *
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER        *
 * DEALINGS IN THE SOFTWARE.                                                  *
 ******************************************************************************/

"use strict";

/*
 * constants
 */

// total size of save file
const CD_SIZE = 8192;
const PC_SIZE = 4324;
const RETRO_SIZE = 32768;

// file names and locations
const DEFAULT_CD_FILE = "saves/defaults.brm";
const DEFAULT_PC_FILE = "saves/s_score.dat";
const DEFAULT_RETRO_FILE = "saves/sdata.bin";
const CD_SAVE_NAME = "soniccd.brm";
const PC_SAVE_NAME = "s_score.dat";
const RETRO_PC_SAVE_NAME = "sdata.bin";
const RETRO_MOBILE_SAVE_NAME = "sgame.bin";
const MIME_TYPE = "application/x-sonic-cd-save-file";
const STORAGE_NAME = "soniccd";
const HEX_VIEW_WIDTH = 16;

// console format
const IDENTIFIER = "SEGA_CD_ROM\x00\x01\x00\x00\x00RAM_CARTRIDGE___";
const CD_SLOTS     = 1;
const CD_SLOT_SIZE = 704;
const CD_START     = 0x040;
// single-player
const CD_STAGE_OFFSET         = 0x2a4;
const CD_GOOD_FUTURES_OFFSET  = 0x2a7;
const CD_NEW_GAME_OFFSET      = 0x2a8;
const CD_SPECIAL_STAGE_OFFSET = 0x2ac;
const CD_TIME_STONES_OFFSET   = 0x2ad;
// time attack
const CD_TIMES_OFFSET         = 0x000;
const CD_INITIALS_OFFSET      = 0x150;
const CD_LAST_INITIALS_OFFSET = 0x2a0;
const CD_COMPLETED_OFFSET     = 0x2a5;
const TIME_ATTACK_LENGTH = 4;
const TIME_ATTACK_PLACES = 3;
const INITIALS_LENGTH    = 3;

// PC format
const PC_SLOTS     = 6;
const PC_SLOT_SIZE = 720;
const PC_START     = 0x004;
const PC_NAME_OFFSET     = 0x004;
const PC_DATETIME_OFFSET = 0x014;
const PC_NAME_LENGTH = 12;
// single-player
const PC_NEW_GAME_OFFSET      = 0x000;
const PC_STAGE_OFFSET         = 0x010;
const PC_TIME_STONES_OFFSET   = 0x2c4;
const PC_GOOD_FUTURES_OFFSET  = 0x2c5;
const PC_SPECIAL_STAGE_OFFSET = 0x2c6;
// time attack
const PC_TIMES_OFFSET      = 0x020;
const PC_TOTAL_TIME_OFFSET = 0x2c0;

// Retro format
const RETRO_SLOTS     = 4;
const RETRO_SLOT_SIZE = 32;
const RETRO_START     = 0x000;
const RETRO_ACTS      = 10;
// single-player
const RETRO_CHARACTER_OFFSET     = 0x000;
const RETRO_LIVES_OFFSET         = 0x004;
const RETRO_SCORE_OFFSET         = 0x008;
const RETRO_STAGE_OFFSET         = 0x00c;
const RETRO_MACHINES_OFFSET      = 0x01c;
const RETRO_HOLOGRAMS_OFFSET     = 0x01e;
const RETRO_TIME_STONES_OFFSET   = 0x010;
const RETRO_SPECIAL_STAGE_OFFSET = 0x014;
const RETRO_NEXT_EXTRA_LIFE_OFFSET = 0x018;
const ALL_MACHINES = 0x3fff;
const IN_SPECIAL_ZONE = 0x50;
// time attack
const RETRO_TIMES_OFFSET     = 0x0c0;
const RETRO_COMPLETED_OFFSET = 0x09c;
// options
const RETRO_MUSIC_OFFSET      = 0x084;
const RETRO_SOUND_OFFSET      = 0x088;
const RETRO_SPIN_DASH_OFFSET  = 0x08c;
const RETRO_TAILS_OFFSET      = 0x090;
const RETRO_FILTER_OFFSET     = 0x094;
const RETRO_SOUNDTRACK_OFFSET = 0x098;
const PC_MAX_VOLUME     = 9;
const MOBILE_MAX_VOLUME = 10;

// game mechanics
const STAGES = [
	"Palmtree Panic",  "Collision Chaos", "Tidal Tempest", "Quartz Quadrant",
	"Wacky Workbench", "Stardust Speedway", "Metallic Madness"
];
const ROUNDS = 7;
const ZONES = 3;
const TOTAL_LEVELS = ROUNDS * ZONES;
const TIME_STONES = 7;
const EXTRA_LIFE = 50000;
const COMPLETED = 0x7f; // for good futures and time stones
const NEW_GAME = 0x10, CONTINUE = 0x70;
const SONIC = 0, TAILS = 1, KNUCKLES = 2;
const DEFAULT_LIVES = 3, DEFAULT_CONTINUES = 0;

// dynamic background
const BACKGROUND_HOLD = 10000; // in ms
const BACKGROUND_IMAGES = 17;
const PRESENT = "present", BAD_FUTURE = "badfuture", GOOD_FUTURE = "goodfuture";

// editor
const CD = 0, PC = 1, RETRO = 2;
const SAVE_SLOT = 0, SINGLE_PLAYER = 1, TIME_ATTACK = 2;

// characters for time attack initials
const CHARACTERS = [
	" ", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
	"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
	"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

// digits for time attack ticks
const DIGITS = Array(60).fill().map(function(undefined, i) {
	return Math.floor(100 * i / 60);
});

// seeded pseudorandom numbers used by PC version
const SRAND_SEQUENCE = [
	0x83, 0x0c, 0x27, 0xdf, 0x0f, 0x2c, 0xbb, 0x88, 0x24, 0xf4, 0x89, 0xf0,
	0xb8, 0x17, 0xc6, 0x86, 0x49, 0xa6, 0x8e, 0x0c, 0x66, 0x87, 0x83, 0xa5,
	0x71, 0x24, 0xb7, 0x2f, 0xa3, 0x60, 0xcc, 0xd2, 0x50, 0xcf, 0x59, 0xd9,
	0x6d, 0x26, 0x90, 0xc1, 0x4f, 0xf0, 0x1e, 0x90, 0xb5, 0x83, 0x53, 0x69,
	0x09, 0x33, 0x83, 0x5c, 0xe3, 0xc5, 0xac, 0x82, 0xcf, 0x27, 0x58, 0x4a,
	0x50, 0x5e, 0xc5, 0x0e, 0x25, 0xbf, 0x44, 0xea, 0xca, 0x62, 0xdf, 0xcd,
	0x42, 0xd4, 0x3e, 0xd0, 0x14, 0x0c, 0xcc, 0xc7, 0x94, 0xa0, 0x15, 0x16,
	0x63, 0x39, 0x72, 0xc7, 0x39, 0x45, 0xe9, 0xd9, 0xe2, 0xeb, 0x4f, 0xda,
	0x87, 0x44, 0xaf, 0xb8, 0x2f, 0xc8, 0xf0, 0xd4, 0x85, 0x06, 0xb1, 0x58,
	0xdc, 0x99, 0x78, 0xcb, 0x70, 0x57, 0x0c, 0xe2, 0xef, 0xcb, 0x1f, 0x99,
	0x38, 0xe6, 0x30, 0x83, 0x62, 0xf1, 0xb0, 0x5e, 0x00, 0xc6, 0x64, 0xeb,
	0xa3, 0x40, 0x0a, 0xfd, 0xa1, 0xf0, 0x3f, 0xcf, 0x15, 0x11, 0xa0, 0x9a,
	0x27, 0xbe, 0x30, 0x67, 0x8e, 0x63, 0xfa, 0x22, 0x53, 0x72, 0xf7, 0xf1,
	0xd7, 0x57, 0x31, 0xc4, 0x17, 0xad, 0x29, 0x2c, 0x2f, 0xb2, 0x76, 0x70,
	0x1d, 0xf8, 0xb0, 0xde, 0xc8, 0x5e, 0x8c, 0x5f, 0x41, 0x3f, 0x48, 0x4e,
	0x48, 0xe9, 0x4a, 0x8a, 0x12, 0x51, 0x04, 0xca, 0x49, 0x05, 0x1a, 0x31,
	0x55, 0x61, 0xc7, 0x23, 0xda, 0x06, 0x7d, 0x56, 0x81, 0x88, 0xcb, 0x2c,
	0xfc, 0x67, 0x84, 0x40, 0x44, 0x41, 0x1e, 0x3e, 0x25, 0x45, 0x58, 0xf9,
	0xfd, 0xeb, 0x1f, 0xb7, 0xc1, 0xe2, 0xb3, 0xcf, 0x40, 0x4a, 0x06, 0x77,
	0xac, 0x24, 0x65, 0xd7, 0x56, 0x07, 0x59, 0x62, 0xb9, 0x14, 0xd0, 0x65,
	0xba, 0x2c, 0x78, 0xe0, 0x2e, 0x60, 0x6c, 0x96, 0x9d, 0xa8, 0x12, 0x60,
	0x45, 0xd8, 0x43, 0xc6, 0x62, 0xd1, 0xad, 0xd0, 0xad, 0xf4, 0x76, 0x1a,
	0x23, 0xdd, 0x22, 0x27, 0x07, 0x4d, 0xb7, 0xf7, 0x2a, 0x67, 0x1f, 0xdc,
	0x6a, 0x20, 0xcd, 0x89, 0x79, 0xf1, 0xa4, 0x6c, 0xe0, 0xce, 0x14, 0x3e,
	0x43, 0x5c, 0x86, 0xd8, 0xe6, 0x5f, 0xfa, 0x48, 0x70, 0x71, 0xee, 0x24,
	0xef, 0xfa, 0x82, 0x1e, 0x1d, 0x5c, 0xdb, 0xd9, 0xe2, 0x6e, 0xc5, 0xfb,
	0x19, 0x2c, 0x9c, 0x84, 0x97, 0xad, 0x6c, 0x5e, 0x69, 0x55, 0x57, 0x34,
	0x5e, 0x4b, 0x37, 0x88, 0xc6, 0x2d, 0x85, 0x00, 0x78, 0x03, 0x7a, 0x01,
	0x1a, 0x72, 0x73, 0x7f, 0x9c, 0x33, 0x9a, 0x14, 0x06, 0xc3, 0xc3, 0x4f,
	0x74, 0x5b, 0x94, 0x4e, 0x5e, 0x22, 0xe9, 0x8f, 0x1d, 0xa2, 0x76, 0x03,
	0xab, 0x78, 0xaf, 0x64, 0xab, 0x50, 0xe4, 0xc9, 0xa9, 0x11, 0xb1, 0x78,
	0xa2, 0x55, 0x95, 0xfb, 0xc7, 0x1c, 0xe1, 0x76, 0x7e, 0xc1, 0xd4, 0x37,
	0xaa, 0x2d, 0x04, 0x8f, 0x2c, 0x4a, 0xff, 0xe0, 0xaa, 0xba, 0x33, 0xf8,
	0x8e, 0xca, 0x0b, 0x9d, 0x52, 0xa1, 0x5b, 0x69, 0xfc, 0xbe, 0xfe, 0xd9,
	0xe4, 0xa1, 0xbe, 0xa0, 0xbd, 0xc7, 0x73, 0x41, 0xd3, 0xdc, 0x6f, 0xdc,
	0x92, 0x2d, 0x1a, 0x48, 0x48, 0x5c, 0xda, 0x63, 0x2c, 0x57, 0x36, 0xa6,
	0x9e, 0x8a, 0x3a, 0xfd, 0xb0, 0x54, 0x1d, 0xd5, 0xe6, 0xb8, 0x21, 0x76,
	0x3a, 0x56, 0xbb, 0x93, 0x63, 0x99, 0xf4, 0x1f, 0x57, 0x31, 0x0f, 0x63,
	0x0f, 0xc4, 0x6c, 0x4e, 0x8a, 0xe0, 0xac, 0x0c, 0x14, 0x35, 0x16, 0xda,
	0xc8, 0x01, 0x39, 0x18, 0x54, 0xcb, 0xd3, 0x9f, 0xfc, 0x54, 0xf2, 0x56,
	0xe2, 0xcb, 0x59, 0x00, 0x84, 0x40, 0x25, 0x58, 0x86, 0x5b, 0xb1, 0x60,
	0xb2, 0x4e, 0xb6, 0xf6, 0x3d, 0x08, 0xb7, 0xa8, 0x4b, 0xab, 0x9c, 0xc9,
	0xb6, 0x41, 0x9d, 0xc4, 0x0b, 0xab, 0x61, 0xb1, 0xd6, 0xd9, 0x67, 0x26,
	0x20, 0x41, 0xa6, 0x50, 0x35, 0x89, 0x70, 0x42, 0xab, 0x87, 0x9c, 0x8c,
	0x9f, 0x6c, 0xe4, 0x10, 0x42, 0x3c, 0x8c, 0x11, 0x95, 0x82, 0x45, 0x8d,
	0x70, 0x41, 0x50, 0xcd, 0xc9, 0x2d, 0xe6, 0x3a, 0x33, 0x1b, 0xd8, 0x72,
	0xa5, 0xb7, 0x73, 0x9b, 0x7d, 0x75, 0xa6, 0xf8, 0xc4, 0xca, 0x67, 0xb9,
	0xb4, 0x9b, 0x52, 0x18, 0x77, 0xf6, 0x93, 0xa1, 0x32, 0x00, 0x07, 0xd1,
	0x42, 0x2e, 0x9e, 0xe3, 0xc6, 0xb8, 0x04, 0xe7, 0x5d, 0x4b, 0x80, 0x14,
	0x31, 0xff, 0x1c, 0x5f, 0x34, 0x88, 0x06, 0x4d, 0xa9, 0xb0, 0x36, 0x05,
	0xe7, 0x05, 0x51, 0xa9, 0x59, 0xce, 0xcd, 0xe6, 0xca, 0x44, 0x57, 0xca,
	0xdf, 0xff, 0x71, 0xd6, 0xe5, 0xaf, 0x60, 0x55, 0xcd, 0x0c, 0x45, 0xec,
	0x75, 0x10, 0x8a, 0x71, 0x2a, 0x63, 0x7f, 0x00, 0x6a, 0x17, 0x45, 0x4c,
	0xee, 0x95, 0xec, 0x34, 0xe8, 0xd7, 0xd8, 0x97, 0x89, 0xd8, 0x69, 0x68,
	0xc6, 0x49, 0xdb, 0x05, 0x5c, 0x86, 0x6a, 0xc4, 0x11, 0xc8, 0xba, 0xcf,
	0x3d, 0x9c, 0x77, 0x33, 0x8a, 0x94, 0x38, 0x33, 0xf8, 0x3c, 0xaa, 0xe2,
	0x24, 0x4f, 0xea, 0xf1, 0xc9, 0x2b, 0x32, 0xc5, 0x87, 0x83, 0xb8, 0xcc,
	0xe3, 0x54, 0xd3, 0x12, 0x90, 0x1a, 0x60, 0x0f, 0xed, 0x43, 0x64, 0xc4,
	0xce, 0xe4, 0xf3, 0x06, 0x7f, 0xab, 0x50, 0x19, 0x06, 0x15, 0x55, 0x80,
	0xa9, 0xe0, 0x15, 0x14, 0xb0, 0xc4, 0xc1, 0x54, 0x6c, 0x5e, 0xc8, 0xfc
];

/*
 * initialization
 */

window.addEventListener("load", function() {
	const bg = new Background();
	const editor = new Editor(bg);
	const store = new Storage(STORAGE_NAME);

	bg.init();

	try {
		const {save, selected} = store.load();
		const saveCollection = new SaveCollection();

		if (save != undefined) {
			saveCollection.loadFromStorage(save);
		}

		editor.open(saveCollection, selected);
	} catch (err) {
		store.reset();
		displayError(err);
	}

	window.addEventListener("beforeunload", function() {
		store.save(editor.saveToStorage());
	});
	window.addEventListener("keyup", function(event) {
		const keyCode = event.keyCode;

		if (keyCode == 27) { // Esc
			for (const element of $$(".overlay")) {
				element.classList.remove("open");
			}
		}

		if (keyCode == 192) { // grave
			editor.toggleHexView();
		}
	});

	document.addEventListener("click", async function(event) {
		const element = event.target;

		if (element.matches("#download")) {
			try {
				const {filename, blob} = await editor.saveToFile();

				const a = $("#link");
				a.download = filename;
				a.href = window.URL.createObjectURL(blob);
				a.click();
				window.URL.revokeObjectURL(blob);
			} catch (err) {
				displayError(err);
			}
		}

		if (element.matches("#reset")) {
			editor.restoreDefaults();
		}

		if (element.matches(".character")) {
			for (const button of $$(".character")) {
				button.classList.toggle("selected", element == button);
			}

			editor.saveSinglePlayer();
		}

		if (element.matches(".future")) {
			const state = element.classList.contains("good");
			element.classList.toggle("good", !state);
			element.classList.toggle("bad",   state);

			editor.saveSinglePlayer();
		}

		if (element.matches(".machine")) {
			element.classList.toggle("destroyed");
			editor.saveSinglePlayer();
		}

		if (element.matches(".timeStone")) {
			const state = element.classList.contains("collected");
			element.classList.toggle("collected", !state);
			element.classList.toggle("empty",      state);

			editor.saveSinglePlayer();
		}

		if (element.matches(".platform")) {
			editor.setPlatform(Number(element.value));
		}

		if (element.matches(".soundtrack")) {
			selectButton(element, ".soundtrack");
			editor.saveOptions();
		}

		if (element.matches(".spinDash")) {
			selectButton(element, ".spinDash");
			editor.saveOptions();
		}

		if (element.matches(".tails")) {
			selectButton(element, ".tails");
			editor.saveOptions();
		}

		if (element.closest(".close")) {
			element.closest(".overlay").classList.remove("open");
		}
	});
	document.addEventListener("input", function(event) {
		const element = event.target;

		if (element.matches("#slot0")) {
			editor.setSlot(Number(element.value), SAVE_SLOT);
		}

		if (element.matches("#slot1")) {
			editor.setSlot(Number(element.value), SINGLE_PLAYER);
		}

		if (element.matches("#slot2")) {
			editor.setSlot(Number(element.value), TIME_ATTACK);
		}

		if (element.matches("#slots input, #slots select")) {
			editor.saveSaveSlot();
		}

		if (element.matches("#options input")) {
			editor.saveOptions();
		}

		if (element.matches("#singlePlayer input, #singlePlayer select")) {
			editor.saveSinglePlayer();
		}

		if (element.matches("#level, .tick, .time")) {
			editor.saveTimeAttack();
		}

		// load but not save to avoid saving times from previous level
		// to next level
		if (element.matches("#currentLevel")) {
			editor.loadTimeAttack();
		}
	});
	document.addEventListener("focusout", function(event) {
		const element = event.target;

		if (element.matches(".initials")) {
			editor.saveTimeAttack();
		}
	});

	$("#file").addEventListener("change", function(event) {
		const file = event.target.files[0];

		if (file != null) {
			const reader = new FileReader();
			reader.addEventListener("load", function(event) {
				try {
					const saveCollection = new SaveCollection();
					saveCollection.loadFromFile(file.name, event.target.result);
					editor.open(saveCollection);
				} catch (err) {
					displayError(err);
				}
			});
			reader.readAsArrayBuffer(file);
		}
	});

	function displayError(message) {
		$("#error").classList.add("open");
		$("#error p").textContent = message;
	}

	function selectButton(element, selector) {
		for (const button of $$(selector)) {
			button.classList.toggle("active", element == button);
		}
	}
});

function $(selector) {
	return document.querySelector(selector);
}

function $$(selector) {
	return Array.from(document.querySelectorAll(selector));
}

/*
 * Editor prototype
 */

function Editor(bg) {
	this.saveCollection = null;
	this.selected = [0, 0, 0];

	this.bg = bg;
}

Editor.prototype.open = function(saveCollection, selected) {
	this.saveCollection = saveCollection;

	if (Array.isArray(selected)) {
		this.selected = selected;
	}

	this.selected[SAVE_SLOT] = saveCollection.selected || 0;

	this.setSlot(this.selected[SAVE_SLOT],     SAVE_SLOT);
	this.setSlot(this.selected[SINGLE_PLAYER], SINGLE_PLAYER);
	this.setSlot(this.selected[TIME_ATTACK],   TIME_ATTACK);

	this.setPlatform();
	this.loadOptions();

	// support for Knuckles mod
	$("#knuckles").hidden = !saveCollection.andKnuckles;
};

Editor.prototype.setSlot = function(selected=0, mode=SAVE_SLOT) {
	if (selected >= this.saveCollection.length) {
		return;
	}

	this.selected[mode] = selected;
	$(`#slot${mode}`).value = selected;

	if (mode == SAVE_SLOT) {
		this.saveCollection.selected = selected;
		this.loadSaveSlot();
	} else if (mode == SINGLE_PLAYER) {
		this.loadSinglePlayer();
	} else if (mode == TIME_ATTACK) {
		this.loadTimeAttack();
	}

	this.bg.changeBackground();
};

Editor.prototype.toggleSlots = function(selected=1, mode=SAVE_SLOT) {
	selected--;

	if (selected < $(`#slot${mode}`).selectedIndex) {
		this.setSlot(selected, mode);
	}

	for (const element of $$(`#slot${mode} option`)) {
		element.disabled = element.value > selected;
	}
};

Editor.prototype.restoreDefaults = function() {
	const saveCollection = new SaveCollection();
	saveCollection.platform = this.saveCollection.platform;

	this.open(saveCollection);
};

Editor.prototype.saveToFile = async function() {
	if (this.saveCollection.length == 0) {
		return;
	}

	let defaultsFilename = "", filename = "";

	if (this.saveCollection.platform == CD) {
		defaultsFilename = DEFAULT_CD_FILE;
		filename = CD_SAVE_NAME;
	} else if (this.saveCollection.platform == PC) {
		defaultsFilename = DEFAULT_PC_FILE;
		filename = PC_SAVE_NAME;
	} else if (this.saveCollection.platform == RETRO) {
		defaultsFilename = DEFAULT_RETRO_FILE;

		if (this.saveCollection.options.mobile) {
			filename = RETRO_MOBILE_SAVE_NAME;
		} else {
			filename = RETRO_PC_SAVE_NAME;
		}
	}

	const defaults = await loadDefaults(defaultsFilename);
	const file = this.saveCollection.saveToFile(defaults);

	return {filename, blob: new Blob([file], {type: MIME_TYPE})};

	function loadDefaults(filename) {
		return new Promise(function(resolve) {
			const xhr = new XMLHttpRequest();

			// loads default save data
			xhr.addEventListener("readystatechange", function() {
				if (this.readyState == 4 && this.status == 200) {
					resolve(this.response);
				}
			});
			xhr.open("GET", filename, true);
			xhr.responseType = "arraybuffer";
			xhr.send();
		});
	}
};

Editor.prototype.saveToStorage = function() {
	if (this.saveCollection.slots.length > 0) {
		return {
			save:     this.saveCollection.saveToStorage(),
			selected: this.selected
		};
	}
};

Editor.prototype.loadSaveSlot = function() {
	const current = this.selected[SAVE_SLOT];
	const slot = this.saveCollection.slots[current];

	if (slot == null) {
		return;
	}

	const data = slot.saveSlot;

	$("#name").value = data.name;

	const timestamp = data.timestamp || Math.floor(Date.now());
	const datetime = new Date(timestamp);

	const year  = (1900 + datetime.getYear()).toString();
	const month = (datetime.getMonth() + 1).toString().padStart(2, "0");
	const day   = datetime.getDate().toString().padStart(2, "0");
	const hour  = datetime.getHours().toString().padStart(2, "0");
	const min   = datetime.getMinutes().toString().padStart(2, "0");
	const sec   = datetime.getSeconds().toString().padStart(2, "0");

	$("#date").value = `${year}-${month}-${day}`;
	$("#time").value = `${hour}:${min}:${sec}`;
};

Editor.prototype.loadOptions = function() {
	if (this.saveCollection == null) {
		return;
	}

	const data = this.saveCollection.options;

	setButton(".soundtrack", data.soundtrack);
	setButton(".spinDash", data.spinDash);
	setButton(".tails", data.unlockTails);

	const maxVolume = data.mobile ? MOBILE_MAX_VOLUME : PC_MAX_VOLUME;
	$("#mobile").checked = data.mobile;

	// Retro version handles volumes differently on mobile
	for (const element of $$(".volume")) {
		element.setAttribute("max", maxVolume);
	}

	if (!data.mobile) {
		data.musicVolume = Math.min(data.musicVolume, PC_MAX_VOLUME);
		data.soundVolume = Math.min(data.soundVolume, PC_MAX_VOLUME);
	}

	$("#musicVolume").value = data.musicVolume;
	$("#showMusicVolume").textContent = formatVolume(data.musicVolume);

	$("#soundVolume").value = data.soundVolume;
	$("#showSoundVolume").textContent = formatVolume(data.soundVolume);

	const FILTERS = ["Sharp", "Smooth", "Nostalgia"];
	$("#videoFilter").value = data.videoFilter;
	$("#showVideoFilter").textContent = FILTERS[data.videoFilter];

	function setButton(selector, value) {
		for (const element of $$(selector)) {
			element.classList.toggle("active", value == Number(element.value));
		}
	}

	function formatVolume(vol) {
		return Math.round((vol / maxVolume) * 100) + "%";
	}
};

Editor.prototype.loadSinglePlayer = function() {
	const current = this.selected[SINGLE_PLAYER];
	const slot = this.saveCollection.slots[current];

	if (slot == null) {
		return;
	}

	const data = slot.singlePlayer;
	let changed = false;

	for (const element of $$(".character")) {
		const state = data.character == Number(element.value);
		element.classList.toggle("selected", state);
		element.disabled = data.isNew;
	}

	$("#lives").value = data.lives;
	$("#score").value = data.score;
	$("#holograms").value = data.holograms;

	$("#lives").disabled = data.isNew;
	$("#score").disabled = data.isNew;
	$("#holograms").disabled = data.isNew;

	let goodFutures = 0;

	for (const [n, element] of $$(".future").entries()) {
		const value = Number(element.value) & data.goodFutures;
		// always bad future if not played yet
		const state = value && n < data.stage;

		if (state) {
			goodFutures += value;
		}

		element.classList.toggle("bad", !state);
		element.classList.toggle("good", state);
		element.disabled = data.isNew || n >= data.stage;

		if (value && n >= data.stage) {
			changed = true;
		}
	}

	let machines = 0;

	for (const element of $$(".machine")) {
		const value = Number(element.value) & data.machines;
		machines += value;

		element.classList.toggle("destroyed", value);
		element.disabled = data.isNew;
	}

	let timeStones = 0;

	for (const element of $$(".timeStone")) {
		const value = Number(element.value) & data.timeStones;
		timeStones += value;

		element.classList.toggle("empty",    !value);
		element.classList.toggle("collected", value);
		element.disabled = data.isNew;
	}

	const allGoodFutures = goodFutures == COMPLETED;
	const allMachines = machines == ALL_MACHINES;
	const allTimeStones = timeStones == COMPLETED;

	let stage = 0, src = "";

	if (data.isNew) {
		src = "images/title.png";
	} else {
		let period = "present";

		if (this.saveCollection.platform == RETRO) {
			switch (data.act) {
				case 2:
				case 6:
					period = "past";
					break;
				case 3:
				case 7:
				case 9:
					period = "goodfuture";
					break;
				case 4:
				case 8:
				case 10:
					period = "badfuture";
					break;
				default:
					period = "present";
			}
		}

		stage = data.stage;
		src = `images/stage-0${stage}-${period}.png`;
	}

	$("#stages").value = stage;
	$("#act").value = data.act;
	$("#act").disabled = data.isNew;
	loadImage("#stage", src);

	$("#inSpecialStage").checked = data.inSpecialStage;

	let n = 0;

	if (!allTimeStones) {
		const unplayedSpecialStages = [];

		for (let i = 0; i < TIME_STONES; i++) {
			const value = timeStones & 1 << i;

			if (value == 0) {
				unplayedSpecialStages.push(i + 1);
			}
		}

		const options = $$("#specialStages option");

		for (const element of options) {
			const value = Number(element.value);
			element.disabled = !unplayedSpecialStages.includes(value);
		}

		n = data.specialStage;

		if (!unplayedSpecialStages.includes(n)) {
			// finds first selectable special stage
			const element = options.find(function(option) {
				return Number(option.value) == unplayedSpecialStages[0];
			});
			n = Number(element.value);
			changed = true;
		}
	}

	$("#specialStages").value = n;
	$("#specialStages").disabled = data.isNew || allTimeStones;
	loadImage("#specialStage", `images/specialstage-0${n}.png`);

	const state = data.timeStones == COMPLETED;
	$("#inSpecialStage").disabled = state;
	$("#inSpecialStage").closest("label").classList.toggle("disabled", state);

	if (state) {
		$("#inSpecialStage").checked = false;
	}

	// determines good ending or bad ending if last stage selected
	if (stage >= ROUNDS) {
		if (allGoodFutures || allMachines || allTimeStones) {
			this.bg.setTimePeriod(GOOD_FUTURE);
		} else {
			this.bg.setTimePeriod(BAD_FUTURE);
		}
	} else {
		this.bg.setTimePeriod(PRESENT);
	}

	// saves again if something changed by rules and not by user
	if (changed) {
		this.saveSinglePlayer();
	}

	function loadImage(selector, src) {
		const img = new Image();
		img.src = src;
		img.addEventListener("load", function() {
			$(selector).src = this.src;
		});
	}
};

Editor.prototype.loadTimeAttack = function() {
	const current = this.selected[TIME_ATTACK];
	const slot = this.saveCollection.slots[current];

	if (slot == null) {
		return;
	}

	const data = slot.timeAttack;

	const selected = Number($("#currentLevel").value);
	$("#showCurrentLevel").textContent = formatLevel(selected);

	const level = data.level == 0 ? "New Game" : STAGES[data.level - 1];
	$("#level").value = data.level || 0;
	$("#showLevel").textContent = level;

	for (let i = 0; i < TIME_ATTACK_PLACES; i++) {
		const {min, sec, tick, initials} = data.times[selected - 1][i];

		$(`#row${i} .min`).value  = min.toString();
		$(`#row${i} .sec`).value  = sec.toString().padStart(2, "0");
		$(`#row${i} .tick`).value = DIGITS[tick].toString().padStart(2, "0");
		$(`#row${i} .initials`).value = initials;
	}

	const platform = this.saveCollection.platform;

	// Sega CD and Retro versions add up ticks as 1/100,
	// PC version adds up ticks as 1/60
	if (platform == CD || platform == RETRO) {
		const {min, sec, tick} = formatCdTotalTime();
		setTotalTime(min, sec, tick);
	} else if (platform == PC) {
		const {min, sec, tick} = formatPcTotalTime();
		setTotalTime(min, sec, tick);
	}

	$("#defaultInitials").value = data.initials || "";

	function formatLevel(level) {
		if (level <= 0) {
			return "New Game";
		}

		if (level > TOTAL_LEVELS) {
			return "Special Zone " + (level - TOTAL_LEVELS);
		}

		const round = Math.ceil(level / ZONES) - 1;
		const zone = (level - 1) % ZONES;

		return STAGES[round] + " " + ["I", "II", "III"][zone];
	}

	function formatCdTotalTime() {
		let totalTime = 0;

		for (let i = 0; i < TOTAL_LEVELS; i++) {
			const {min, sec, tick} = slot.timeAttack.times[i][0];
			totalTime += min * 60 * 100 + sec * 100 + DIGITS[tick];
		}

		const min  = Math.floor(totalTime / (60 * 100));
		const rem  = totalTime % (60 * 100);
		const sec  = Math.floor(rem / 100);
		const tick = rem % 100;

		return {min, sec, tick};
	}

	function formatPcTotalTime() {
		let totalTime = 0;

		for (let i = 0; i < TOTAL_LEVELS; i++) {
			const {min, sec, tick} = slot.timeAttack.times[i][0];
			totalTime += min * 60 * 60 + sec * 60 + tick;
		}

		const min  = Math.floor(totalTime / (60 * 60));
		const rem  = totalTime % (60 * 60);
		const sec  = Math.floor(rem / 60);
		const tick = DIGITS[rem % 60];

		return {min, sec, tick};
	}

	function setTotalTime(min, sec, tick) {
		$("#totalMin").textContent  = min.toString();
		$("#totalSec").textContent  = sec.toString().padStart(2, "0");
		$("#totalTick").textContent = tick.toString().padStart(2, "0");
	}
};

Editor.prototype.saveSaveSlot = function() {
	const current = this.selected[SAVE_SLOT];
	const slot = this.saveCollection.slots[current];

	if (slot == null) {
		return;
	}

	const datetime = new Date($("#date").value + " " + $("#time").value);

	slot.saveSlot = {
		name:      $("#name").value,
		timestamp: datetime.getTime()
	};
	this.loadSaveSlot();
};

Editor.prototype.saveOptions = function() {
	if (this.saveCollection == null) {
		return;
	}

	this.saveCollection.options = {
		mobile:      $("#mobile").checked,
		soundtrack:  this.fillToggle(".soundtrack.active", 0),
		musicVolume: this.fillNumber("#musicVolume"),
		soundVolume: this.fillNumber("#soundVolume"),
		spinDash:    this.fillToggle(".spinDash.active", 0),
		videoFilter: this.fillNumber("#videoFilter"),
		unlockTails: this.fillToggle(".tails.active", 0)
	};
	this.loadOptions();
};

Editor.prototype.saveSinglePlayer = function() {
	const current = this.selected[SINGLE_PLAYER];
	const slot = this.saveCollection.slots[current];

	if (slot == null) {
		return;
	}

	const goodFutures = $$(".good").reduce(countSelected, 0);
	const timeStones = $$(".collected").reduce(countSelected, 0);
	const machines = $$(".destroyed").reduce(countSelected, 0);

	const stage = Number($("#stages").value);

	slot.singlePlayer = {
		isNew:          stage == 0,
		character:      this.fillToggle(".character.selected", SONIC),
		lives:          this.fillNumber("#lives"),
		score:          this.fillNumber("#score"),
		stage:          stage,
		act:            Number($("#act").value),
		specialStage:   Number($("#specialStages").value),
		inSpecialStage: $("#inSpecialStage").checked,
		goodFutures:    goodFutures,
		machines:       machines,
		holograms:      this.fillNumber("#holograms"),
		timeStones:     timeStones
	};
	this.loadSinglePlayer();

	function countSelected(count, element) {
		return count + Number(element.value);
	}
};

Editor.prototype.saveTimeAttack = function() {
	const current = this.selected[TIME_ATTACK];
	const slot = this.saveCollection.slots[current];

	if (slot == null) {
		return;
	}

	const times = [];

	for (let i = 0; i < TIME_ATTACK_PLACES; i++) {
		times.push({
			min:  this.fillNumber(`#row${i} .min`),
			sec:  this.fillNumber(`#row${i} .sec`),
			tick: $(`#row${i} .tick`).selectedIndex,
			initials: $(`#row${i} .initials`).value
		});
	}

	const index = Number($("#currentLevel").value) - 1;
	slot.timeAttack.times[index] = times;
	slot.timeAttack.level = this.fillNumber("#level");
	slot.timeAttack.initials = $("#defaultInitials").value;

	this.loadTimeAttack();
};

Editor.prototype.setPlatform = function(platform) {
	if (this.saveCollection.length == 0) {
		return;
	}

	if (platform != undefined) {
		this.saveCollection.platform = platform;
	} else {
		platform = this.saveCollection.platform;
	}

	document.documentElement.className = ["cd", "pc", "retro"][platform] || "";

	for (const element of $$(".platform")) {
		element.classList.toggle("active", platform == Number(element.value));
	}

	for (const element of $$(".cd, .pc, .retro")) {
		const state = (platform == CD && !element.classList.contains("cd"))
			|| (platform == PC && !element.classList.contains("pc"))
			|| (platform == RETRO && !element.classList.contains("retro"));
		element.hidden = state;
	}

	if (platform == CD) {
		this.toggleSlots(CD_SLOTS, SAVE_SLOT);
		this.toggleSlots(CD_SLOTS, SINGLE_PLAYER);
		this.toggleSlots(CD_SLOTS, TIME_ATTACK);
	} else if (platform == PC) {
		this.toggleSlots(PC_SLOTS, SAVE_SLOT);
		this.toggleSlots(PC_SLOTS, SINGLE_PLAYER);
		this.toggleSlots(PC_SLOTS, TIME_ATTACK);
	} else if (platform == RETRO) {
		this.toggleSlots(1, SAVE_SLOT);
		this.toggleSlots(RETRO_SLOTS, SINGLE_PLAYER);
		this.toggleSlots(1, TIME_ATTACK);
	}

	this.loadSinglePlayer();
	this.loadTimeAttack();
};

Editor.prototype.fillToggle = function(selector, defaultValue=0) {
	const element = $(selector);

	// checks if element exists before attempting to use its value
	return element != null ? Number(element.value) : defaultValue;
};

Editor.prototype.fillNumber = function(selector) {
	const element = $(selector);

	let value = Number(element.value);
	value = Math.min(element.max, value);
	value = Math.max(element.min, value);

	return value;
};

Editor.prototype.toggleHexView = async function() {
	if (this.saveCollection.length == 0) {
		return;
	}

	const state = !$("#hexview").classList.contains("open");

	if (state) {
		const {blob} = await this.saveToFile();

		const reader = new FileReader();
		reader.addEventListener("load", function(event) {
			const file = new Uint8Array(event.target.result);

			const pad = Math.ceil(Math.log(file.length + 1) / Math.log(16));
			let col = "", hex = "", asc = "";

			for (const [i, character] of file.entries()) {
				hex += character.toString(16).padStart(2, "0") + " ";

				// range of printable characters in ASCII
				if (character >= 0x20 && character <= 0x7e) {
					asc += String.fromCharCode(character) + " ";
				} else {
					asc += "  ";
				}

				if (i % HEX_VIEW_WIDTH == 0) {
					col += i.toString(16).padStart(pad, "0") + "\n";
				} else if ((i + 1) % HEX_VIEW_WIDTH == 0) {
					hex += "\n";
					asc += "\n";
				}
			}

			$("#col").textContent = col;
			$("#hex").textContent = hex;
			$("#asc").textContent = asc;
		});
		reader.readAsArrayBuffer(blob);
	} else {
		$("#col").textContent = "";
		$("#hex").textContent = "";
		$("#asc").textContent = "";
	}

	$("#hexview").classList.toggle("open", state);
};

/*
 * SaveCollection prototype
 */

function SaveCollection() {
	this.slots = Array(PC_SLOTS).fill().map(function(undefined, i) {
		return new SaveSlot(i);
	});
	this.options = {
		mobile:      false,
		soundtrack:  0,
		musicVolume: MOBILE_MAX_VOLUME,
		soundVolume: MOBILE_MAX_VOLUME,
		spinDash:    0,
		videoFilter: 0,
		unlockTails: 0
	};
	this.platform = CD;
	this.selected = 0;
	this.andKnuckles = false;
}

SaveCollection.prototype.loadFromFile = function(name, buffer) {
	const extension = name.split(".").pop().toLowerCase();

	const file = new Uint8Array(buffer);
	let selected = -1;

	if (extension == "brm" || extension == "crm") {
		selected = this.openCdFile(file);
		this.platform = CD;
	} else if (extension == "dat") {
		selected = this.openPcFile(file);
		this.platform = PC;
	} else if (extension == "bin") {
		selected = this.openRetroFile(file);
		this.platform = RETRO;
	}

	if (selected < 0) {
		throw "Could not determine format of file.";
	}

	this.selected = selected;

	// enables Knuckles as selectable character if any slot uses him
	this.andKnuckles = this.slots.some(function(slot) {
		return slot.singlePlayer.character == KNUCKLES;
	});
};

SaveCollection.prototype.loadFromStorage = function(obj) {
	const {slots, options, platform, selected, andKnuckles} = obj;

	this.slots = slots.map(function(save, i) {
		const slot = new SaveSlot(i);
		slot.load(save);

		return slot;
	});

	this.options  = options;
	this.platform = platform || CD;
	this.selected = selected || 0;
	this.andKnuckles = andKnuckles;
};

SaveCollection.prototype.saveToFile = function(defaults) {
	let file = null;

	if (this.platform == CD) {
		file = this.saveCdFile(defaults);
	} else if (this.platform == PC) {
		file = this.savePcFile(defaults);
	} else if (this.platform == RETRO) {
		file = this.saveRetroFile(defaults);
	}

	return file;
};

SaveCollection.prototype.saveToStorage = function() {
	return {
		slots:       this.slots,
		options:     this.options,
		platform:    this.platform,
		selected:    this.selected,
		andKnuckles: this.andKnuckles
	};
};

SaveCollection.prototype.openCdFile = function(file) {
	if (file.length % CD_SIZE != 0) {
		return -1;
	}

	const identifier = file.slice(file.length - IDENTIFIER.length, file.length);

	// validates file by looking for string
	if (hexToStr(identifier) != IDENTIFIER) {
		return -1;
	}

	for (let i = 0; i < CD_SLOTS; i++) {
		const slot = new SaveSlot(i);
		slot.openCdSlot(file.slice(
			CD_START + i * CD_SLOT_SIZE,
			CD_START + (i + 1) * CD_SLOT_SIZE
		));

		this.slots[i] = slot;
	}

	return 0;

	// converts hex to ASCII
	function hexToStr(arr) {
		return arr.reduce(function(str, hex) {
			return str + String.fromCharCode(hex);
		}, "");
	}
};

SaveCollection.prototype.openPcFile = function(file) {
	if (file.length != PC_SIZE) {
		return -1;
	}

	if (file[0] > PC_SLOTS - 1 || file[1] + file[2] + file[3] != 0) {
		return -1;
	}

	for (let i = 0; i < PC_SLOTS; i++) {
		const slot = new SaveSlot(i);
		slot.openPcSlot(file.slice(
			PC_START + i * PC_SLOT_SIZE,
			PC_START + (i + 1) * PC_SLOT_SIZE
		));

		this.slots[i] = slot;
	}

	return file[0]; // selected file
};

SaveCollection.prototype.openRetroFile = function(file) {
	if (file.length != RETRO_SIZE) {
		return -1;
	}

	for (let i = 0; i < RETRO_SLOTS; i++) {
		const slot = new SaveSlot(i);
		slot.openRetroSinglePlayerSlot(file.slice(
			RETRO_START + i * RETRO_SLOT_SIZE,
			RETRO_START + (i + 1) * RETRO_SLOT_SIZE
		));

		if (i == 0) {
			slot.openRetroTimeAttackSlot(file);
		}

		this.slots[i] = slot;
	}

	let musicVolume = file[RETRO_MUSIC_OFFSET];
	let soundVolume = file[RETRO_SOUND_OFFSET];

	// tries to identify mobile version by volume setting;
	// defaults to false in ambiguous case of both volumes muted
	const mobile = musicVolume > PC_MAX_VOLUME
	            || soundVolume > PC_MAX_VOLUME;

	if (mobile) {
		musicVolume /= 10;
		soundVolume /= 10;
	}

	this.options = {
		mobile:      mobile,
		soundtrack:  file[RETRO_SOUNDTRACK_OFFSET],
		musicVolume: musicVolume,
		soundVolume: soundVolume,
		spinDash:    file[RETRO_SPIN_DASH_OFFSET],
		videoFilter: file[RETRO_FILTER_OFFSET],
		unlockTails: file[RETRO_TAILS_OFFSET]
	};

	return 0;
};

SaveCollection.prototype.saveCdFile = function(defaults) {
	const file = new Uint8Array(defaults);
	let pos = CD_START;

	for (let i = 0; i < CD_SLOTS; i++) {
		if (this.slots[i].isEmpty) {
			continue;
		}

		const buffer = this.slots[i].saveCdSlot();

		for (let j = 0; j < buffer.length; j++, pos++) {
			file[pos] = buffer[j];
		}
	}

	return file;
};

SaveCollection.prototype.savePcFile = function(defaults) {
	const file = new Uint8Array(defaults);
	let pos = PC_START;

	for (let i = 0; i < PC_SLOTS; i++) {
		if (this.slots[i].isEmpty) {
			continue;
		}

		const buffer = this.slots[i].savePcSlot();

		for (let j = 0; j < buffer.length; j++, pos++) {
			file[pos] = buffer[j];
		}
	}

	file[0] = this.selected; // first byte is selected file

	return file;
};

SaveCollection.prototype.saveRetroFile = function(defaults) {
	const file = new Uint8Array(defaults);
	let pos = RETRO_START;

	for (let i = 0; i < RETRO_SLOTS; i++) {
		if (this.slots[i].isEmpty) {
			continue;
		}

		if (i == 0) {
			mergeSection(this.slots[i].saveRetroTimeAttackSlot());
		}

		const buffer = this.slots[i].saveRetroSinglePlayerSlot();
		mergeSection(buffer, pos);
		pos += buffer.length;
	}

	let musicVolume = this.options.musicVolume;
	let soundVolume = this.options.soundVolume;

	if (this.options.mobile) {
		musicVolume *= 10;
		soundVolume *= 10;
	}

	file[RETRO_MUSIC_OFFSET]      = musicVolume;
	file[RETRO_SOUND_OFFSET]      = soundVolume;
	file[RETRO_SPIN_DASH_OFFSET]  = this.options.spinDash;
	file[RETRO_TAILS_OFFSET]      = this.options.unlockTails;
	file[RETRO_FILTER_OFFSET]     = this.options.videoFilter;
	file[RETRO_SOUNDTRACK_OFFSET] = this.options.soundtrack;

	return file;

	function mergeSection(bytes, start=0) {
		for (let i = 0; i < bytes.length; i++) {
			file[start + i] = bytes[i];
		}
	}
};

/*
 * SaveSlot prototype
 */

function SaveSlot(slot=0) {
	this.isEmpty = false;

	this.saveSlot = {
		name:      "PLAYER " + (slot + 1),
		timestamp: Date.now()
	};

	this.singlePlayer = {
		isNew:          slot > 0,
		character:      SONIC,
		lives:          DEFAULT_LIVES,
		score:          DEFAULT_CONTINUES,
		stage:          1,
		act:            1,
		specialStage:   1,
		inSpecialStage: false,
		goodFutures:    0,
		machines:       0,
		holograms:      0,
		timeStones:     0
	};

	const newTimes = Array(TOTAL_LEVELS + TIME_STONES).fill().map(function() {
		return Array(TIME_ATTACK_PLACES).fill().map(function() {
			return {
				min:  5,
				sec:  0,
				tick: 0,
				initials: "AAA"
			};
		});
	});

	this.timeAttack = {
		times:    newTimes,
		level:    Number(slot == 0),
		initials: "YOU"
	};
}

SaveSlot.prototype.load = function(obj) {
	const {isEmpty, saveSlot, singlePlayer, timeAttack} = obj;

	this.isEmpty = isEmpty;

	if (saveSlot != undefined) {
		this.saveSlot = saveSlot;
	}

	if (singlePlayer != undefined) {
		this.singlePlayer = singlePlayer;
	}

	if (timeAttack != undefined) {
		this.timeAttack = timeAttack;
	}
};

SaveSlot.prototype.openCdSlot = function(original) {
	const file = new Uint8Array(original);
	const isNew = file[CD_NEW_GAME_OFFSET] == NEW_GAME;
	let stage = 0, specialStage = 0;

	if (!isNew) {
		stage = file[CD_STAGE_OFFSET] + 1;
	}

	if (file[CD_TIME_STONES_OFFSET] != COMPLETED) {
		specialStage = file[CD_SPECIAL_STAGE_OFFSET] + 1;
	}

	let machines = 0, holograms = 0;

	for (let i = 0, j = 0; i < ROUNDS; i++, j += 2) {
		const value = Boolean(file[CD_GOOD_FUTURES_OFFSET] & 1 << i);
		machines |= (value << j) | (value << j + 1);

		// gives credit for holograms for good futures,
		// except on Metallic Madness, which has no holograms
		if (i < ROUNDS - 1) {
			holograms += 2 * value;
		}
	}

	const times = [];
	let sum = 0;

	for (let i = 0; i < TOTAL_LEVELS + TIME_STONES; i++) {
		const start = CD_TIMES_OFFSET + i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES;
		const places = [];

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH;
			const offset = CD_INITIALS_OFFSET - CD_TIMES_OFFSET;

			sum += file[pos + 1] + file[pos + 2] + file[pos + 3];

			places.push({
				min:  file[pos + 1],
				sec:  file[pos + 2],
				tick: file[pos + 3],
				initials: getInitials(pos + offset, INITIALS_LENGTH)
			});
		}

		times.push(places);
	}

	if (sum == 0) {
		this.isEmpty = true;
		return;
	}

	this.singlePlayer = {
		isNew:          isNew,
		character:      SONIC,
		lives:          3,
		score:          0,
		stage:          Math.min(stage, ROUNDS),
		act:            1,
		specialStage:   Math.min(specialStage, TIME_STONES),
		inSpecialStage: false,
		goodFutures:    file[CD_GOOD_FUTURES_OFFSET],
		machines:       machines,
		holograms:      holograms,
		timeStones:     file[CD_TIME_STONES_OFFSET]
	};

	this.timeAttack = {
		times:    times,
		level:    Math.floor(file[CD_COMPLETED_OFFSET] / ZONES),
		initials: getInitials(CD_LAST_INITIALS_OFFSET, INITIALS_LENGTH)
	};

	function getInitials(pos, length) {
		return file.slice(pos, pos + length).reduce(function(str, letter) {
			const character = CHARACTERS[letter] || " ";
			return str + character;
		}, "");
	}
};

SaveSlot.prototype.openPcSlot = function(original) {
	const file = new Uint8Array(this.encodePcSlot(original));
	const timestamp = getDateTime().getTime();

	if (timestamp <= 0) {
		this.isEmpty = true;
		return;
	}

	if (!this.verifyPcChecksum(file)) {
		this.isEmpty = true;
		return;
	}

	const isNew = !Boolean(file[PC_NEW_GAME_OFFSET]);
	let stage = 0, specialStage = 0;

	if (!isNew) {
		stage = file[PC_STAGE_OFFSET] + 1;
	}

	if (file[PC_TIME_STONES_OFFSET] != COMPLETED) {
		specialStage = file[PC_SPECIAL_STAGE_OFFSET] + 1;
	}

	let machines = 0, holograms = 0;

	for (let i = 0, j = 0; i < ROUNDS; i++, j += 2) {
		const value = Boolean(file[PC_GOOD_FUTURES_OFFSET] & 1 << i);
		machines |= (value << j) | (value << j + 1);

		// gives credit for holograms for good futures,
		// except on Metallic Madness, which has no holograms
		if (i < ROUNDS - 1) {
			holograms += 2 * value;
		}
	}

	const times = [];

	for (let i = 0; i < TOTAL_LEVELS + TIME_STONES; i++) {
		const start = PC_TIMES_OFFSET + 2 * i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES;
		const places = [];

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH * 2;

			const {min, sec, tick} = getTime(file[pos] | (file[pos + 1] << 8));
			let initials = getString(pos + 4, INITIALS_LENGTH);
			initials = initials.replace(/_/g, " ").trimEnd();

			places.push({min, sec, tick, initials});
		}

		times.push(places);
	}

	this.saveSlot = {
		name:      getString(PC_NAME_OFFSET, PC_NAME_LENGTH),
		timestamp: timestamp
	};

	this.singlePlayer = {
		isNew:          isNew,
		character:      SONIC,
		lives:          3,
		score:          0,
		stage:          Math.min(stage, ROUNDS),
		act:            1,
		specialStage:   Math.min(specialStage, TIME_STONES),
		inSpecialStage: false,
		goodFutures:    file[PC_GOOD_FUTURES_OFFSET],
		machines:       machines,
		holograms:      holograms,
		timeStones:     file[PC_TIME_STONES_OFFSET]
	};

	this.timeAttack = {
		times:    times,
		level:    file[PC_STAGE_OFFSET],
		initials: "YOU"
	};

	function getString(pos, length) {
		return file.slice(pos, pos + length).reduce(function(str, letter) {
			return str + String.fromCharCode(letter);
		}, "");
	}

	function getDateTime() {
		return new Date(
			file[PC_DATETIME_OFFSET] | (file[PC_DATETIME_OFFSET + 1] << 8),
			file[PC_DATETIME_OFFSET + 2] - 1, // month
			file[PC_DATETIME_OFFSET + 4],     // day
			file[PC_DATETIME_OFFSET + 6],     // hour
			file[PC_DATETIME_OFFSET + 8],     // min
			file[PC_DATETIME_OFFSET + 10]     // sec
		);
	}

	function getTime(time) {
		const min  = Math.floor(time / (60 * 60));
		const rem  = time % (60 * 60);
		const sec  = Math.floor(rem / 60);
		const tick = time % 60;

		return {min, sec, tick};
	}
};

SaveSlot.prototype.openRetroSinglePlayerSlot = function(original) {
	const file = new Uint8Array(original);
	const isNew = file[RETRO_STAGE_OFFSET] == 0;
	let stage = 0, act = 0, inSpecialStage = false;

	if (!isNew) {
		stage = Math.floor(file[RETRO_STAGE_OFFSET] / RETRO_ACTS) + 1;
		act = file[RETRO_STAGE_OFFSET] - RETRO_ACTS * (stage - 1);
		inSpecialStage = stage > IN_SPECIAL_ZONE;
	}

	const specialStage = file[RETRO_SPECIAL_STAGE_OFFSET] + 1;

	if (inSpecialStage) {
		stage -= IN_SPECIAL_ZONE;
	}

	const score = file[RETRO_SCORE_OFFSET]
	            | file[RETRO_SCORE_OFFSET + 1] << 8
	            | file[RETRO_SCORE_OFFSET + 2] << 16;

	const machines = file[RETRO_MACHINES_OFFSET]
	               | file[RETRO_MACHINES_OFFSET + 1] << 8;

	let goodFutures = 0;

	for (let i = 0, j = 0; i < ROUNDS; i++, j += 2) {
		const act1 = machines & 1 << j;
		const act2 = machines & 1 << j + 1;
		goodFutures |= Boolean(act1 | act2) << i;
	}

	this.singlePlayer = {
		isNew:          isNew,
		character:      file[RETRO_CHARACTER_OFFSET],
		lives:          file[RETRO_LIVES_OFFSET],
		score:          score,
		stage:          Math.min(stage, ROUNDS),
		act:            Math.min(act, RETRO_ACTS),
		specialStage:   Math.min(specialStage, TIME_STONES),
		inSpecialStage: inSpecialStage,
		goodFutures:    goodFutures,
		machines:       machines,
		holograms:      file[RETRO_HOLOGRAMS_OFFSET],
		timeStones:     file[RETRO_TIME_STONES_OFFSET]
	};
};

SaveSlot.prototype.openRetroTimeAttackSlot = function(original) {
	const file = new Uint8Array(original);
	const times = [];
	let isEmpty = true;

	for (let i = 0; i < TOTAL_LEVELS; i++) {
		const start = RETRO_TIMES_OFFSET + 2 * i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES;
		const places = [];

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH * 2;

			const time = file[pos] | (file[pos + 1] << 8);
			const {min, sec, tick} = getTime(time);
			places.push({min, sec, tick: convertTick(tick), initials: "AAA"});

			isEmpty &= time == 0;
		}

		times.push(places);
	}

	for (let i = 0; i < TIME_STONES; i++) { // special stages
		const start = RETRO_TIMES_OFFSET + 2 * i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES * ZONES + TIME_ATTACK_LENGTH;
		const places = [];

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH * 2;

			const time = file[pos] | (file[pos + 1] << 8);
			const {min, sec, tick} = getTime(time);
			places.push({min, sec, tick: convertTick(tick), initials: "AAA"});

			isEmpty &= time == 0;
		}

		times.push(places);
	}

	// only replaces default time attack data if section is not empty
	if (!isEmpty) {
		this.timeAttack = {
			times:    times,
			level:    file[RETRO_COMPLETED_OFFSET],
			initials: "YOU"
		};
	}

	function convertTick(tick) {
		// converts from 1/100 to 1/60
		return DIGITS.findIndex(function(num) {
			return num == tick;
		});
	}

	function getTime(time) {
		const min  = Math.floor(time / (60 * 100));
		const rem  = time % (60 * 100);
		const sec  = Math.floor(rem / 100);
		const tick = time % 100;

		return {min, sec, tick};
	}
};

SaveSlot.prototype.saveCdSlot = function() {
	const file = new Uint8Array(CD_SLOT_SIZE);

	file[CD_NEW_GAME_OFFSET] = this.singlePlayer.isNew ? NEW_GAME : CONTINUE;
	file[CD_GOOD_FUTURES_OFFSET] = this.singlePlayer.goodFutures;
	file[CD_TIME_STONES_OFFSET]  = this.singlePlayer.timeStones;

	if (this.singlePlayer.isNew) {
		file[CD_STAGE_OFFSET] = 0;
	} else {
		file[CD_STAGE_OFFSET] = this.singlePlayer.stage - 1;
	}

	if (this.singlePlayer.timeStones == COMPLETED) {
		// sets to zero when all time stones collected
		file[CD_SPECIAL_STAGE_OFFSET] = 0;
	} else {
		file[CD_SPECIAL_STAGE_OFFSET] = this.singlePlayer.specialStage - 1;
	}

	for (let i = 0; i < TOTAL_LEVELS + TIME_STONES; i++) {
		const start = CD_TIMES_OFFSET + i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES;

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH;

			file[pos + 1] = this.timeAttack.times[i][j].min;
			file[pos + 2] = this.timeAttack.times[i][j].sec;
			file[pos + 3] = this.timeAttack.times[i][j].tick;

			setInitials(
				pos + CD_INITIALS_OFFSET - CD_TIMES_OFFSET,
				this.timeAttack.times[i][j].initials
			);
		}
	}

	setInitials(CD_LAST_INITIALS_OFFSET, this.timeAttack.initials);

	file[CD_COMPLETED_OFFSET] = this.timeAttack.level * ZONES;

	return file;

	function setInitials(pos, initials) {
		initials = initials.toUpperCase();

		for (let i = 0; i < INITIALS_LENGTH; i++) {
			file[pos + i] = CHARACTERS.findIndex(function(chr) {
				return chr == initials[i];
			});
		}
	}
};

SaveSlot.prototype.savePcSlot = function() {
	const file = new Uint8Array(PC_SLOT_SIZE);
	let name = this.saveSlot.name.toUpperCase();
	name = name.replace(/ /g, "_").padEnd(PC_NAME_LENGTH, " ");

	for (let i = 0; i < PC_NAME_LENGTH; i++) {
		file[PC_NAME_OFFSET + i] = name.charCodeAt(i);
	}

	const datetime = new Date(this.saveSlot.timestamp);
	const year = 1900 + datetime.getYear();

	file[PC_DATETIME_OFFSET]      =  year & 0x00ff;
	file[PC_DATETIME_OFFSET + 1]  = (year & 0xff00) >> 8;
	file[PC_DATETIME_OFFSET + 2]  = datetime.getMonth() + 1;
	file[PC_DATETIME_OFFSET + 4]  = datetime.getDate();
	file[PC_DATETIME_OFFSET + 6]  = datetime.getHours();
	file[PC_DATETIME_OFFSET + 8]  = datetime.getMinutes();
	file[PC_DATETIME_OFFSET + 10] = datetime.getSeconds();

	if (this.singlePlayer.isNew) {
		file[PC_STAGE_OFFSET] = 0;
	} else if (
		this.singlePlayer.stage >= ROUNDS
		&& this.timeAttack.level >= ROUNDS
	) {
		// Metallic Madness beaten and available in Time Attack
		file[PC_STAGE_OFFSET] = ROUNDS;
	} else {
		file[PC_STAGE_OFFSET] = this.singlePlayer.stage - 1;
	}

	if (this.singlePlayer.timeStones == COMPLETED) {
		// sets to zero when all time stones collected
		file[PC_SPECIAL_STAGE_OFFSET] = 0;
	} else {
		file[PC_SPECIAL_STAGE_OFFSET] = this.singlePlayer.specialStage - 1;
	}

	file[PC_NEW_GAME_OFFSET]     = !this.singlePlayer.isNew;
	file[PC_GOOD_FUTURES_OFFSET] =  this.singlePlayer.goodFutures;
	file[PC_TIME_STONES_OFFSET]  =  this.singlePlayer.timeStones;

	let totalTime = 0;

	for (let i = 0; i < TOTAL_LEVELS + TIME_STONES; i++) {
		const start = PC_TIMES_OFFSET + 2 * i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES;

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH * 2;

			const {min, sec, tick} = this.timeAttack.times[i][j];
			const time = min * 60 * 60 + sec * 60 + tick;
			setTime(pos, time);

			let initials = this.timeAttack.times[i][j].initials;
			initials = initials.toUpperCase().replace(/[^-0-9A-Z]/g, " ");

			for (let k = 0; k < INITIALS_LENGTH; k++) {
				file[pos + k + 4] = initials.charCodeAt(k);
			}

			if (j == 0 && i < TOTAL_LEVELS) { // skips special stages
				// adds up first-place times
				totalTime += time;
			}
		}
	}

	setTime(PC_TOTAL_TIME_OFFSET, totalTime);

	const checksum = this.calculatePcChecksum(file);

	// writes new checksum to end of data
	file[file.length - 4] =  checksum & 0x00ff;
	file[file.length - 3] = (checksum & 0xff00) >> 8;

	return this.encodePcSlot(file);

	function setTime(pos, time) {
		file[pos]     =  time & 0x0000ff;
		file[pos + 1] = (time & 0x00ff00) >> 8;
		// stage times never need third byte but total time does
		file[pos + 2] = (time & 0xff0000) >> 16;
	}
};

SaveSlot.prototype.saveRetroSinglePlayerSlot = function() {
	const file = new Uint8Array(RETRO_SLOT_SIZE);
	const specialStage = Math.max(this.singlePlayer.specialStage - 1, 0);

	file[RETRO_CHARACTER_OFFSET]     = this.singlePlayer.character;
	file[RETRO_LIVES_OFFSET]         = this.singlePlayer.lives;
	file[RETRO_HOLOGRAMS_OFFSET]     = this.singlePlayer.holograms;
	file[RETRO_SPECIAL_STAGE_OFFSET] = specialStage;
	file[RETRO_TIME_STONES_OFFSET]   = this.singlePlayer.timeStones;

	if (this.singlePlayer.isNew) {
		file[RETRO_STAGE_OFFSET] = 0;
	} else {
		let stage = (this.singlePlayer.stage - 1) * RETRO_ACTS
			+ this.singlePlayer.act;

		if (this.singlePlayer.inSpecialStage) {
			stage += IN_SPECIAL_ZONE;
		}

		file[RETRO_STAGE_OFFSET] = Math.max(stage, 1);
	}

	const machines = this.singlePlayer.machines;
	file[RETRO_MACHINES_OFFSET]     =  machines & 0x00ff;
	file[RETRO_MACHINES_OFFSET + 1] = (machines & 0xff00) >> 8;

	const score = this.singlePlayer.score;
	setScore(RETRO_SCORE_OFFSET, score);

	// must set to the next multiple of 50,000 after current score, or the game
	// awards the player extra lives for each multiple of 50,000 between this
	// value and the current score
	if (!this.singlePlayer.isNew) {
		const nextExtraLife = score + (EXTRA_LIFE - score % EXTRA_LIFE);
		setScore(RETRO_NEXT_EXTRA_LIFE_OFFSET, nextExtraLife);
	}

	return file;

	function setScore(pos, score) {
		file[pos]     =  score & 0x000000ff;
		file[pos + 1] = (score & 0x0000ff00) >> 8;
		file[pos + 2] = (score & 0x00ff0000) >> 16;
		file[pos + 3] = (score & 0xff000000) >> 32;
	}
};

SaveSlot.prototype.saveRetroTimeAttackSlot = function() {
	const file = new Uint8Array(RETRO_SIZE);

	for (let i = 0; i < TOTAL_LEVELS; i++) {
		const start = RETRO_TIMES_OFFSET + 2 * i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES;

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH * 2;

			const {min, sec, tick} = this.timeAttack.times[i][j];
			setTime(pos, min * 60 * 100 + sec * 100 + DIGITS[tick]);
		}
	}

	for (let i = 0; i < TIME_STONES; i++) { // special stages
		const start = RETRO_TIMES_OFFSET + 2 * i * TIME_ATTACK_LENGTH
			* TIME_ATTACK_PLACES * ZONES + TIME_ATTACK_LENGTH;

		for (let j = 0; j < TIME_ATTACK_PLACES; j++) {
			const pos = start + j * TIME_ATTACK_LENGTH * 2;

			const {min, sec, tick} = this.timeAttack.times[TOTAL_LEVELS + i][j];
			setTime(pos, min * 60 * 100 + sec * 100 + DIGITS[tick]);
		}

		// sets unused slots to 5 minutes
		for (let j = 0; j < TIME_ATTACK_PLACES * 2; j++) {
			const pos = start + (j + TIME_ATTACK_PLACES)
				* TIME_ATTACK_LENGTH * 2;
			setTime(pos, 5 * 60 * 100);
		}
	}

	file[RETRO_COMPLETED_OFFSET] = this.timeAttack.level;

	return file;

	function setTime(pos, time) {
		file[pos]     =  time & 0x00ff;
		file[pos + 1] = (time & 0xff00) >> 8;
	}
};

SaveSlot.prototype.calculatePcChecksum = function(bytes) {
	let checksum = 0;

	// adds all bytes of file as signed integers
	for (let i = 0; i < bytes.length - 4; i++) {
		if (bytes[i] < 0x80) {
			checksum += bytes[i];
		} else { // converts two's complement
			checksum -= 0xff - bytes[i] + 1;
		}
	}

	return checksum;
};

SaveSlot.prototype.verifyPcChecksum = function(bytes) {
	const original = bytes[bytes.length - 4] | (bytes[bytes.length - 3] << 8);
	const checksum = this.calculatePcChecksum(bytes);

	return original == checksum;
};

SaveSlot.prototype.encodePcSlot = function(bytes) {
	return bytes.map(function(value, i) {
		return value ^ SRAND_SEQUENCE[i];
	});
};

/*
 * Background prototype
 */

function Background() {
	this.index = BACKGROUND_IMAGES + 1;
	this.period = PRESENT;
}

Background.prototype.init = function() {
	window.setInterval(function() { // cycles sky
		this.index++;

		// background rotation uses absolute value function for symmetry;
		// skip two values here to skip 0 and skip repeating 1
		if (this.index == BACKGROUND_IMAGES) {
			this.index += 2;
		}

		this.index %= 2 * BACKGROUND_IMAGES;

		this.changeBackground();
	}.bind(this), BACKGROUND_HOLD);
};

Background.prototype.changeBackground = function() {
	const index = Math.abs(this.index - BACKGROUND_IMAGES).toString();
	const period = this.period != BAD_FUTURE ? GOOD_FUTURE : BAD_FUTURE;
	const url = "images/sky-" + period + "-" + index.padStart(2, "0") + ".png";

	const bg = new Image();
	bg.src = url;
	bg.addEventListener("load", function() {
		document.documentElement.style.backgroundImage = `url(${url})`;
	});
};

Background.prototype.setTimePeriod = function(period) {
	this.period = period;

	const littlePlanet = new Image();
	littlePlanet.src = "images/planet-" + period + ".png";
	littlePlanet.addEventListener("load", function() {
		const element = $("#littlePlanet img");

		// only reloads background if it changes
		if (element.src != littlePlanet.src) {
			element.src = littlePlanet.src;
			this.changeBackground();
		}
	}.bind(this));
};

/*
 * Storage prototype
 */

function Storage(name) {
	this.name = name;
}

Storage.prototype.load = function() {
	try {
		const contents = localStorage.getItem(this.name);

		if (contents != null) {
			return JSON.parse(contents);
		}
	} catch (err) {
		console.error(err);
		this.reset();
	}

	return {};
};

Storage.prototype.save = function(file) {
	try {
		if (file != undefined) {
			localStorage.setItem(this.name, JSON.stringify(file));
		} else {
			this.reset();
		}
	} catch (err) {
		console.error(err);
	}
};

Storage.prototype.reset = function() {
	try {
		localStorage.removeItem(this.name);
	} catch (err) {
		console.error(err);
	}
};