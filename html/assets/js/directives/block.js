// Insertion element for each key.
var blocks = {};

angular.module('myApp').directive(
    'blockInsertion',
    function () {
        return {
            restrict: 'A',
            link: function (scope, iElement, iAttrs) {
                var key = iAttrs.blockInsertion;
                blocks[key] = iElement;

                // Assume that block-insertion directives won't get
                // removed after they're inserted. A more robust
                // implementation would clean these up on $destroy.
            }
        };
    }
).directive(
    'blockReplacement',
    function () {
        return {
            restrict: 'A',
            link: function (scope, iElement, iAttrs) {
                var key = iAttrs.blockReplacement;

                // Prepare to move our element to its corresponding
                // block insertion point.
                iElement.remove();

                if (! blocks[key]) {
                    // No matching block insertion, so just hide.
                    return;
                }

                blocks[key].replaceWith(iElement);

                scope.$on(
                    '$destroy',
                    function () {
                        // Restore the insertion element.
                        iElement.replaceWith(blocks[key]);
                    }
                );
            }
        }
    }
);