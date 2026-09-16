# TX formation table

Edit `original/tx_formation.json` to add formations. Publish the JSON with the site;
no adapter changes are needed. Reload an already open page to load the updated table.

- `groups[].formations`: maps the API's `train_orchestration_number` to the formation label.
- `series`: vehicle series shown in the detail dialog.
- `note`: optional suffix appended after the formation in parentheses.
- `style`: existing fleet metadata, not a new train-type icon style.

Add entries to an existing group for additional units of the same series, or add a
group for a new series. Keep each API number unique across groups. Car count is not
used to identify a formation. Unknown numbers never receive a guessed formation;
the previous TX-2000 series fallback remains. Failure to load the optional table
does not stop position updates, and the next update retries loading the table.
