<?php
/**
 * This file is part of FacturaScripts
 * Copyright (C) 2017-2018 Carlos Garcia Gomez <carlos@facturascripts.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
namespace FacturaScripts\Core\Lib\Widget;

use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Description of WidgetFile
 *
 * @author Carlos García Gómez  <carlos@facturascripts.com>
 */
class WidgetFile extends BaseWidget
{

    /**
     * 
     * @param object $model
     * @param string $title
     * @param string $description
     *
     * @return string
     */
    public function edit($model, $title = '', $description = '')
    {
        $description = static::$i18n->trans('help-server-accepts-filesize', ['%size%' => $this->getMaxFileUpload()]) . ' ' . $description;
        return parent::edit($model, $title, $description);
    }

    /**
     * Return the max file size that can be uploaded.
     *
     * @return int
     */
    protected function getMaxFileUpload()
    {
        return UploadedFile::getMaxFilesize() / 1024 / 1024;
    }

    /**
     * 
     * @param string $type
     * @param string $extraClass
     *
     * @return string
     */
    protected function inputHtml($type = 'file', $extraClass = '')
    {
        $class = empty($extraClass) ? 'form-control-file' : 'form-control-file ' . $extraClass;
        return '<input type="' . $type . '" name="' . $this->fieldname . '" value="' . $this->value
            . '" class="' . $class . '"' . $this->inputHtmlExtraParams() . '/>';
    }
}
