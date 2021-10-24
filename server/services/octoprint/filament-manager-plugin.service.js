const Logger = require("../../handlers/logger");
const Filament = require("../../models/Filament");
const Profile = require("../../models/Profile");
const { OPClientErrors } = require("./constants/octoprint-service.constants");
const OctoPrintApiService = require("./octoprint-api.service");
const DITokens = require("../../container.tokens");
const { processResponse } = require("./utils/api.utils");

class FilamentManagerPluginService extends OctoPrintApiService {
  apiPluginManager = `${this.apiBase}/plugin/pluginmanager`;
  apiPluginManagerRepository1_6_0 = `${this.octoPrintBase}plugin/pluginmanager/repository`;
  apiPluginPiSupport = `${this.apiBase}/plugin/pi_support`;
  apiPluginFilamentManagerSpools = `${this.apiBase}/plugin/filamentmanager/spools`;
  apiPluginFilamentManagerSelections = `${this.apiBase}/plugin/filamentmanager/selections/0`;
  apiPluginFilamentManagerProfiles = `${this.apiBase}/plugin/filamentmanager/profiles`;

  #printersStore;
  #octoPrintApiService;

  #logger = new Logger("Server-FilamentManager");

  constructor(cradle) {
    super(cradle);
    this.#printersStore = cradle[DITokens.printersStore];
    this.#octoPrintApiService = cradle[DITokens.octoPrintApiService];
  }

  #validateFilamentId(value) {
    // filamentId needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(value);
    if (isNaN(parsedFilamentID)) {
      throw OPClientErrors.filamentIdNotANumber;
    }

    return parsedFilamentID;
  }

  async listProfiles(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPluginFilamentManagerProfiles);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async createProfile(printer, profile, responseOptions) {
    const path = `${this.apiPluginFilamentManagerProfiles}/`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this._httpClient.post(url, profile, options);
    return processResponse(response, responseOptions);
  }

  async listFilament(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPluginFilamentManagerSpools);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getFilament(printer, filamentID, responseOptions) {
    const path = `${this.apiPluginFilamentManagerSpools}/${filamentID}`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async createFilamentSpool(printer, spool, responseOptions) {
    const path = `${this.apiPluginFilamentManagerSpools}/`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this._httpClient.post(url, spool, options);
    return processResponse(response, responseOptions);
  }

  async setSelectedFilament(printer, filamentId, tool, responseOptions) {
    this.#validateFilamentId(filamentId);
    const selection = {
      tool,
      spool: { id: filamentId }
    };
    const path = `${this.apiPluginFilamentManagerSelections}`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this._httpClient.patch(url, selection, options);
    return processResponse(response, responseOptions);
  }

  async updatePrinterSelectedFilament(printer) {
    const returnSpools = [];
    for (let i = 0; i < printer.selectedFilament.length; i++) {
      if (printer.selectedFilament[i] !== null) {
        const filamentId = printer.selectedFilament[i].spools.fmID;
        const validFilamentId = this.#validateFilamentId(filamentId);
        const filament = await this.getFilament(printer.getLoginDetails(), validFilamentId);

        this.#logger.info(`${printer.printerURL}: spools fetched. Status: ${response.status}`);

        const spoolID = printer.selectedFilament[i]._id;
        let spoolEntity = await Filament.findById(spoolID);
        if (!spoolEntity) {
          throw `Spool database entity by ID '${spoolID}' not found. Cant update filament.`;
        }
        const spool = filament.spool;
        spoolEntity = {
          name: spool.name,
          profile: spool.profile.id,
          cost: spool.cost,
          weight: spool.weight,
          used: spool.used,
          tempOffset: spool.temp_offset,
          fmID: spool.id
        };
        await spoolEntity.save();
        returnSpools.push(spoolEntity);
      }
    }

    return returnSpools;
  }

  async filamentManagerReSync(addSpool) {
    const printerStates = this.#printersStore.listPrintersFlat();

    const spools = await this.listFilament(printer);
    const profiles = await this.listProfiles(printer);

    const newSpools = [];
    const updatedSpools = [];
    const newProfiles = [];
    const updatedProfiles = [];

    const addSpools = [];
    const addProfiles = [];

    const spoolsFM = await spools.json();
    const profilesFM = await profiles.json();

    const S = "Filament";
    const P = "Profile";

    for (let s = 0; s < spoolsFM.spools.length; s++) {
      const sp = spoolsFM.spools[s];
      const spools = {
        name: sp.name,
        profile: sp.profile.id,
        price: sp.cost,
        weight: sp.weight,
        used: sp.used,
        tempOffset: sp.temp_offset,
        fmID: sp.id
      };
      const oldSpool = await Filament.findOne({ "spools.fmID": sp.id });
      if (oldSpool !== null) {
        updatedSpools.push(S);
        this.#logger.info("Updating Filament: ", spools);
        oldSpool.spools = spools;
        oldSpool.markModified("spools");
        oldSpool.save();
      } else {
        // New Filament
        this.#logger.info("Saving New Filament: ", spools);
        const newSpool = await new Filament({ spools });
        await newSpool.save();
        if (addSpool) {
          addSpools.push(newSpool);
        } else {
          newSpools.push(S);
        }
      }
    }

    for (let p = 0; p < profilesFM.profiles.length; p++) {
      const pr = profilesFM.profiles[p];
      const profile = {
        index: pr.id,
        density: pr.density,
        diameter: pr.diameter,
        manufacturer: pr.vendor,
        material: pr.material
      };
      const oldProfile = await Profile.findOne({ "profile.index": pr.id });
      if (oldProfile !== null) {
        updatedProfiles.push(P);
        this.#logger.info("Updating Profile: ", profile);
        oldProfile.profile = profile;
        oldProfile.markModified("profile");
        oldProfile.save();
      } else {
        // New Profile
        this.#logger.info("Saving New Profile: ", profile);
        const newProfile = await new Profile({ profile });
        await newProfile.save();
        if (addSpool) {
          addProfiles.push(newProfile);
        } else {
          newProfiles.push(P);
        }
      }
    }

    this.#logger.info("Successfully synced filament manager with 3DPF.");
    if (addSpool) {
      return {
        success: true,
        newProfiles: addProfiles[0],
        newSpools: addSpools[0]
      };
    } else {
      return {
        success: true,
        newSpools: newSpools.length,
        updatedSpools: updatedSpools.length,
        newProfiles: newProfiles.length,
        updatedProfiles: updatedProfiles.length
      };
    }
  }
}

module.exports = FilamentManagerPluginService;
