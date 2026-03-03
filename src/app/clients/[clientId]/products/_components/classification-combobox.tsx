{/* Classification */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Classification</h2>
            <div className="space-y-4">
              <ClassificationCombobox
                label="Season"
                value={seasonCode}
                options={seasons}
                onChange={setSeasonCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Season"),
                    { elementType: "Season", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create season..."
              />
              <ClassificationCombobox
                label="Color"
                value={colorCode}
                options={colors}
                onChange={setColorCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Color"),
                    { elementType: "Color", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create color..."
              />
              <ClassificationCombobox
                label="Gender"
                value={genderCode}
                options={genders}
                onChange={setGenderCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Gender"),
                    { elementType: "Gender", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create gender..."
              />
              <ClassificationCombobox
                label="Category"
                value={categoryCode}
                options={categories}
                onChange={setCategoryCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "ProductCategory"),
                    { elementType: "ProductCategory", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create category..."
              />
              <ClassificationCombobox
                label="Division"
                value={divisionCode}
                options={divisions}
                onChange={setDivisionCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Division"),
                    { elementType: "Division", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create division..."
              />
            </div>
          </div>
